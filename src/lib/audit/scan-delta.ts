import type { AuditPayload } from "@/lib/api-types";
import { buildDeltaFromAudits } from "@/lib/audit/competitor-delta";

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
  const newGaps = currentGaps.filter((g) => !previousGapSet.has(g)).length;
  const resolvedGaps = previousGaps.filter((g) => !currentGapSet.has(g)).length;

  const promptsCitedNet = move.promptsWon.length - move.promptsLost.length;
  const scoreDelta = move.scoreDelta;

  const chips = formatScanDeltaChips({
    scoreDelta,
    promptsCitedNet,
    newGaps,
    resolvedGaps,
    platformSlips: move.platformLosses.length,
  });

  const hasMovement =
    chips.length > 0 ||
    move.promptsWon.length > 0 ||
    move.promptsLost.length > 0;

  return {
    available: hasMovement || scoreDelta != null,
    previousScanAt: input.previous.createdAt,
    scoreDelta,
    promptsCitedNet,
    promptsLost: move.promptsLost.length,
    promptsWon: move.promptsWon.length,
    newGaps,
    resolvedGaps,
    chips,
  };
}
