import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { getCompetitorLimitsForUser } from "@/lib/billing/limits-server";
import { buildCompetitorIntelligence } from "@/lib/competitors/intelligence";
import { competitorLimitMessage } from "@/lib/competitors/limits";
import { domainFormatStatus } from "@/lib/onboarding/domain-validation";
import { normalizeDomain } from "@/lib/audit/site-analyzer";
import { getBacklinkDashboard } from "@/lib/backlinks/store";
import {
  enrichSnapshotWithBacklinks,
  getWorkspaceById,
  toSnapshot,
  updateWorkspace,
} from "@/lib/server/workspace";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export const GET = withApiLogging(async function GET(request: Request, { params }: Params) {
  try {
    const user = await requireApiUser(request);
    if (user instanceof NextResponse) return user;
    const userId = apiUserId(user);

    const { id } = await params;
    const workspace = await getWorkspaceById(id, userId);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const snapshot = await enrichSnapshotWithBacklinks(toSnapshot(workspace), workspace.id);

    let backlinkDomains: string[] = [];
    try {
      const dashboard = await getBacklinkDashboard({
        workspaceId: workspace.id,
        userId,
        domain: workspace.domain,
        businessType: workspace.businessType,
        competitors: workspace.competitors,
        autoRefresh: false,
      });
      backlinkDomains = dashboard.profile.sources.map((s) => s.sourceDomain);
    } catch {
      backlinkDomains = [];
    }

    const limits = await getCompetitorLimitsForUser(
      userId,
      workspace.competitors.length,
    );
    const intelligence = buildCompetitorIntelligence({
      workspace: snapshot,
      plan: limits.plan,
      backlinkDomains,
    });

    return NextResponse.json({ intelligence, limits });
  } catch (error) {
    console.error("GET /api/workspaces/[id]/competitors", error);
    return NextResponse.json(
      { error: "Failed to load competitor intelligence" },
      { status: 500 },
    );
  }
});

export const POST = withApiLogging(async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireApiUser(request);
    if (user instanceof NextResponse) return user;
    const userId = apiUserId(user);

    const { id } = await params;
    const body = (await request.json()) as { domain?: string };
    const raw = body.domain?.trim();
    if (!raw) {
      return NextResponse.json({ error: "domain required" }, { status: 400 });
    }

    const domain = normalizeDomain(raw);
    if (domainFormatStatus(domain) !== "valid") {
      return NextResponse.json({ error: "Enter a valid domain (e.g. rival.com)" }, { status: 400 });
    }

    const workspace = await getWorkspaceById(id, userId);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const yourDomain = normalizeDomain(workspace.domain);
    if (domain === yourDomain) {
      return NextResponse.json({ error: "Cannot track your own domain as a competitor" }, { status: 400 });
    }

    const existing = workspace.competitors.map((c) => normalizeDomain(c));
    if (existing.includes(domain)) {
      return NextResponse.json({ error: "Competitor already tracked" }, { status: 409 });
    }

    const limits = await getCompetitorLimitsForUser(userId, existing.length);
    if (!limits.canAdd) {
      return NextResponse.json(
        { error: competitorLimitMessage(limits), limits },
        { status: 403 },
      );
    }

    const probeRes = await fetch(
      `${new URL(request.url).origin}/api/domains/check?domain=${encodeURIComponent(domain)}`,
      { headers: { cookie: request.headers.get("cookie") ?? "" } },
    );
    const probe = (await probeRes.json().catch(() => ({}))) as { reachable?: boolean };
    if (!probe.reachable) {
      return NextResponse.json(
        { error: "Domain could not be verified — check spelling or try again later" },
        { status: 422 },
      );
    }

    const updated = await updateWorkspace(
      id,
      { competitors: [...existing, domain] },
      userId,
    );
    if (!updated) {
      return NextResponse.json({ error: "Could not save competitor" }, { status: 500 });
    }

    const snapshot = await enrichSnapshotWithBacklinks(toSnapshot(updated), updated.id);
    const newLimits = await getCompetitorLimitsForUser(userId, updated.competitors.length);
    const intelligence = buildCompetitorIntelligence({
      workspace: snapshot,
      plan: newLimits.plan,
    });

    return NextResponse.json({ intelligence, limits: newLimits, workspace: snapshot });
  } catch (error) {
    console.error("POST /api/workspaces/[id]/competitors", error);
    return NextResponse.json({ error: "Failed to add competitor" }, { status: 500 });
  }
});
