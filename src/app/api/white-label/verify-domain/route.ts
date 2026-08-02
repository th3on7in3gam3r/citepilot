import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { userHasFleetAccess } from "@/lib/billing/access";
import { mergePreferences, parsePreferences } from "@/lib/settings";
import {
  normalizeReportDomain,
  reportsCnameTarget,
  upsertVerifiedReportDomain,
  verifyReportDomainCname,
} from "@/lib/white-label/domains";
import { getWorkspaceById, updateWorkspace } from "@/lib/server/workspace";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

export const POST = withApiLogging(async function POST(request: Request) {
  const user = await requireApiUser(request);
  if (user instanceof NextResponse) return user;
  const userId = apiUserId(user);
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  if (!(await userHasFleetAccess(userId))) {
    return NextResponse.json({ error: "Fleet plan required" }, { status: 403 });
  }

  const body = (await request.json()) as { workspaceId?: string; domain?: string };
  const workspaceId = body.workspaceId?.trim();
  const domain = body.domain?.trim();

  if (!workspaceId || !domain) {
    return NextResponse.json(
      { error: "workspaceId and domain required" },
      { status: 400 },
    );
  }

  const ws = await getWorkspaceById(workspaceId, userId);
  if (!ws) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const normalized = normalizeReportDomain(domain);
  const check = await verifyReportDomainCname(normalized);

  if (!check.ok) {
    return NextResponse.json({
      ok: false,
      domain: normalized,
      target: check.target,
      resolved: check.resolved,
      error: check.error ?? `CNAME must point to ${check.target}`,
    });
  }

  await upsertVerifiedReportDomain({
    domain: normalized,
    workspaceId,
    userId,
  });

  const prefs = mergePreferences(ws.preferences ?? parsePreferences("{}"), {
    whiteLabel: {
      customReportDomain: normalized,
      customDomainVerified: true,
    },
  });

  await updateWorkspace(workspaceId, { preferences: prefs }, userId);

  return NextResponse.json({
    ok: true,
    domain: normalized,
    target: check.target,
    resolved: check.resolved,
  });
});

export const GET = withApiLogging(async function GET(request: Request) {
  const target = reportsCnameTarget();
  return NextResponse.json({ target });
});
