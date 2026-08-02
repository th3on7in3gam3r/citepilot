import type { AuditPayload } from "@/lib/api-types";
import { buildDeltaFromAudits } from "@/lib/audit/competitor-delta";

export type ScanDeltaDetail = {
  previousScore: number;
  currentScore: number;
  previousGeoScore: number;
  currentGeoScore: number;
  geoScoreDelta: number;
  previousCited: number;
  currentCited: number;
  citedDelta: number;
  promptTotal: number;
  resolvedGapLabels: string[];
  newGapLabels: string[];
  unchangedGapLabels: string[];
  promptsGained: string[];
  promptsLostLabels: string[];
  /** True when every compared field is identical */
  fullyUnchanged: boolean;
};

export type ScanDeltaSummary = {
  available: boolean;
  previousScanAt: string | null;
  scoreDelta: number | null;
  promptsCitedNet: number;
  promptsLost: number;
  promptsWon: number;
  newGaps: number;
  resolvedGaps: number;
  /** Short lines for UI chips, e.g. "−2 prompts cited", "+1 gap" */
  chips: string[];
  /** Line-item diff for dashboard detail panels */
  detail: ScanDeltaDetail | null;
};

export const emptyScanDeltaSummary: ScanDeltaSummary = {
  available: false,
  previousScanAt: null,
  scoreDelta: null,
  promptsCitedNet: 0,
  promptsLost: 0,
  promptsWon: 0,
  newGaps: 0,
  resolvedGaps: 0,
  chips: [],
  detail: null,
};

function plural(n: number, singular: string, pluralForm?: string): string {
  const p = pluralForm ?? `${singular}s`;
  return Math.abs(n) === 1 ? singular : p;
}

export function formatScanDeltaChips(input: {
  scoreDelta: number | null;
  promptsCitedNet: number;
  newGaps: number;
  resolvedGaps: number;
  platformSlips: number;
}): string[] {
  const chips: string[] = [];

  if (input.promptsCitedNet !== 0) {
    const n = Math.abs(input.promptsCitedNet);
    const sign = input.promptsCitedNet > 0 ? "+" : "−";
    chips.push(
      `${sign}${n} ${plural(n, "prompt")} cited`,
    );
  }

  if (input.newGaps > 0) {
    chips.push(`+${input.newGaps} ${plural(input.newGaps, "gap")}`);
  }

  if (input.resolvedGaps > 0) {
    chips.push(`−${input.resolvedGaps} ${plural(input.resolvedGaps, "gap")} cleared`);
  }

  if (input.scoreDelta != null && input.scoreDelta !== 0) {
    const sign = input.scoreDelta > 0 ? "+" : "";
    chips.push(`${sign}${input.scoreDelta} score`);
  }

  if (input.platformSlips > 0) {
    chips.push(
      `${input.platformSlips} ${plural(input.platformSlips, "platform")} slipped`,
    );
  }

  return chips;
}

export function buildScanDeltaSummary(input: {
  current: AuditPayload;
  previous: AuditPayload | null;
  trackedCompetitors?: string[];
}): ScanDeltaSummary {
  const empty: ScanDeltaSummary = {
    available: false,
    previousScanAt: null,
    scoreDelta: null,
    promptsCitedNet: 0,
    promptsLost: 0,
    promptsWon: 0,
    newGaps: 0,
    resolvedGaps: 0,
    chips: [],
    detail: null,
  };

  if (!input.previous) return empty;

  const currentGaps = Array.isArray(input.current.gaps)
    ? input.current.gaps.filter((g): g is string => typeof g === "string")
    : [];
  const previousGaps = Array.isArray(input.previous.gaps)
    ? input.previous.gaps.filter((g): g is string => typeof g === "string")
    : [];
  const trackedCompetitors = Array.isArray(input.trackedCompetitors)
    ? input.trackedCompetitors
    : Array.isArray(input.current.competitors)
      ? input.current.competitors
      : [];

  let move;
  try {
    move = buildDeltaFromAudits(
      input.current,
      input.previous,
      trackedCompetitors,
    );
  } catch {
    return empty;
  }

  const previousGapSet = new Set(previousGaps);
  const currentGapSet = new Set(currentGaps);
  const resolvedGapLabels = previousGaps.filter((g) => !currentGapSet.has(g));
  const newGapLabels = currentGaps.filter((g) => !previousGapSet.has(g));
  const unchangedGapLabels = currentGaps.filter((g) => previousGapSet.has(g));
  const newGaps = newGapLabels.length;
  const resolvedGaps = resolvedGapLabels.length;

  const promptsCitedNet = move.promptsWon.length - move.promptsLost.length;
  const scoreDelta = move.scoreDelta;
  const promptsGained = move.promptsWon.map((p) => p.prompt);
  const promptsLostLabels = move.promptsLost.map((p) => p.prompt);

  const previousGeoScore = input.previous.siteSignals?.geoScore ?? 0;
  const currentGeoScore = input.current.siteSignals?.geoScore ?? 0;
  const geoScoreDelta = currentGeoScore - previousGeoScore;
  const citedDelta = input.current.cited - input.previous.cited;

  const chips = formatScanDeltaChips({
    scoreDelta,
    promptsCitedNet,
    newGaps,
    resolvedGaps,
    platformSlips: move.platformLosses.length,
  });

  const fullyUnchanged =
    scoreDelta === 0 &&
    geoScoreDelta === 0 &&
    citedDelta === 0 &&
    newGapLabels.length === 0 &&
    resolvedGapLabels.length === 0 &&
    promptsGained.length === 0 &&
    promptsLostLabels.length === 0;

  return {
    available: true,
    previousScanAt: input.previous.createdAt,
    scoreDelta,
    promptsCitedNet,
    promptsLost: move.promptsLost.length,
    promptsWon: move.promptsWon.length,
    newGaps,
    resolvedGaps,
    chips,
    detail: {
      previousScore: input.previous.score,
      currentScore: input.current.score,
      previousGeoScore,
      currentGeoScore,
      geoScoreDelta,
      previousCited: input.previous.cited,
      currentCited: input.current.cited,
      citedDelta,
      promptTotal: input.current.total,
      resolvedGapLabels,
      newGapLabels,
      unchangedGapLabels,
      promptsGained,
      promptsLostLabels,
      fullyUnchanged,
    },
  };
}
