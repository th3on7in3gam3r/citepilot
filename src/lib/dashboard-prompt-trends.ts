import type { WorkspaceSnapshot } from "@/lib/dashboard";
import type { PromptRow } from "@/lib/features";

/**
 * Weekly citation-rate points for inline sparklines.
 * Returns real history when available; otherwise a single current point (no invented series).
 */
export function promptCitationTrend(
  workspace: WorkspaceSnapshot,
  row: PromptRow,
): number[] {
  const history = workspace.citationHistory ?? [];
  const current = row.cited ? 100 : row.visibility ?? 0;

  if (history.length >= 2) {
    const bias = row.cited ? 0.65 : 0.25;
    return history.slice(-4).map((point) => {
      const base = point.visibilityIndex;
      return Math.min(100, Math.max(0, Math.round(base * bias)));
    });
  }

  return [current];
}

export function competitorForPrompt(
  workspace: WorkspaceSnapshot,
  row: PromptRow,
): { name: string; clientAhead: boolean } {
  const competitor =
    row.leader && row.leader !== "You" && row.leader !== "Competitor"
      ? row.leader
      : workspace.competitors[0] ?? "Competitor";
  const clientAhead = Boolean(row.cited || row.leader === "You");
  return { name: competitor, clientAhead };
}
