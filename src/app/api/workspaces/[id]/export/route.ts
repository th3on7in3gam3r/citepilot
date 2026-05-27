import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import {
  FLEET_UPGRADE_MESSAGE,
  userHasFleetAccess,
} from "@/lib/billing/access";
import { PLATFORMS } from "@/lib/dashboard";
import {
  buildCompetitorBenchmark,
  buildCorrelationInsights,
  buildDashboardAlerts,
  platformRowsFromWorkspace,
  promptRowsForWorkspace,
} from "@/lib/dashboard-data";
import {
  enrichSnapshotWithBacklinks,
  getWorkspaceById,
  toSnapshot,
} from "@/lib/server/workspace";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

function topActionsFromWorkspace(workspace: ReturnType<typeof toSnapshot>) {
  return workspace.gaps.length > 0
    ? workspace.gaps.slice(0, 4)
    : [
        `Publish a direct answer page for "${workspace.buyerQuestion}"`,
        "Create a comparison page against your top competitor",
        "Improve structured data and on-page answer formatting",
        "Turn buyer discussion insights into citation-ready content",
      ];
}

function downloadFilename(domain: string) {
  const safeDomain = domain.replace(/[^a-z0-9.-]+/gi, "-").toLowerCase();
  return `${safeDomain || "workspace"}-citepilot-export.json`;
}

export async function GET(request: Request, { params }: Params) {
  try {
    const user = await requireApiUser(request);
    if (user instanceof NextResponse) return user;
    const userId = apiUserId(user);

    const { id } = await params;
    const workspace = await getWorkspaceById(id, userId);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    if (!(await userHasFleetAccess(userId))) {
      return NextResponse.json(
        { error: FLEET_UPGRADE_MESSAGE, code: "FLEET_REQUIRED" },
        { status: 403 },
      );
    }

    const snapshot = await enrichSnapshotWithBacklinks(
      toSnapshot(workspace),
      workspace.id,
    );
    const promptRows = promptRowsForWorkspace(snapshot);
    const platformRows = platformRowsFromWorkspace(snapshot, PLATFORMS);
    const benchmark = buildCompetitorBenchmark(snapshot, promptRows);
    const alerts = buildDashboardAlerts(snapshot, promptRows);
    const correlations = buildCorrelationInsights(snapshot, promptRows);

    const payload = {
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      workspaceId: workspace.id,
      domain: workspace.domain,
      summary: {
        citationScore: snapshot.citationScore,
        visibilityScore: snapshot.visibilityScore,
        citedPlatforms: snapshot.citedPlatforms,
        totalPlatforms: snapshot.totalPlatforms,
        promptsTracked: snapshot.promptsTracked,
      },
      workspace: snapshot,
      platformRows,
      promptRows,
      benchmark,
      alerts,
      correlations,
      topActions: topActionsFromWorkspace(snapshot),
    };

    const response = NextResponse.json(payload);
    response.headers.set("Cache-Control", "private, no-store");

    if (new URL(request.url).searchParams.get("download") === "1") {
      response.headers.set(
        "Content-Disposition",
        `attachment; filename="${downloadFilename(workspace.domain)}"`,
      );
    }

    return response;
  } catch (error) {
    console.error("GET /api/workspaces/[id]/export", error);
    return NextResponse.json(
      { error: "Failed to export workspace intelligence" },
      { status: 500 },
    );
  }
}
