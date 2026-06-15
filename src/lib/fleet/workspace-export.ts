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

export async function buildWorkspaceExportPayload(
  workspaceId: string,
  userId: string,
) {
  const workspace = await getWorkspaceById(workspaceId, userId);
  if (!workspace) return null;

  const snapshot = await enrichSnapshotWithBacklinks(
    toSnapshot(workspace),
    workspace.id,
  );
  const promptRows = promptRowsForWorkspace(snapshot);
  const platformRows = platformRowsFromWorkspace(snapshot, PLATFORMS);
  const benchmark = buildCompetitorBenchmark(snapshot, promptRows);
  const alerts = buildDashboardAlerts(snapshot);
  const correlations = buildCorrelationInsights(snapshot, promptRows);

  return {
    schemaVersion: 1 as const,
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
}
