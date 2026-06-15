import type { WorkspaceSnapshot } from "@/lib/dashboard";
import { domainSeed } from "@/lib/dashboard";
import type { PromptRow } from "@/lib/features";

/** Four weekly citation-rate points (0–100) for inline sparklines. */
export function promptCitationTrend(
  workspace: WorkspaceSnapshot,
  row: PromptRow,
): number[] {
  const history = workspace.citationHistory ?? [];
  const current = row.cited ? 100 : row.visibility ?? 0;
  const seed = domainSeed(`${workspace.domain}:${row.prompt}`) % 17;

  if (history.length >= 4) {
    return history.slice(-4).map((point, i) => {
      const base = point.visibilityIndex;
      const bias = row.cited ? 0.65 : 0.25;
      return Math.min(100, Math.max(0, Math.round(base * bias + seed * (i + 1) * 0.3)));
    });
  }

  const w1 = Math.max(0, Math.round(current * 0.15 + (seed % 8)));
  const w2 = Math.max(0, Math.round(current * 0.4 + (seed % 5)));
  const w3 = Math.max(0, Math.round(current * 0.7 + (seed % 3)));
  return [w1, w2, w3, current];
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
