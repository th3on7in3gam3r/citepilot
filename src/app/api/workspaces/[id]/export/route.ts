import { NextResponse } from "next/server";
import { requireFleetAccess } from "@/lib/fleet/request-auth";
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
import { withApiLogging } from "@/lib/observability/api-log";

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

export const GET = withApiLogging(async function GET(request: Request, { params }: Params) {
  try {
    const auth = await requireFleetAccess(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const workspace = await getWorkspaceById(id, auth.userId);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const snapshot = await enrichSnapshotWithBacklinks(
      toSnapshot(workspace),
      workspace.id,
    );
    const promptRows = promptRowsForWorkspace(snapshot);
    const platformRows = platformRowsFromWorkspace(snapshot, PLATFORMS);
    const benchmark = buildCompetitorBenchmark(snapshot, promptRows);
    const alerts = buildDashboardAlerts(snapshot);
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
    response.headers.set("X-CitePilot-Auth", auth.viaApiKey ? "api-key" : "session");

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
});
