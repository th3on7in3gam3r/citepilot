import type { AuditPayload, PromptResult } from "@/lib/api-types";

export type CompetitorMoveDelta = {
  hasChanges: boolean;
  scoreDelta: number | null;
  promptsLost: PromptResult[];
  promptsWon: PromptResult[];
  newCompetitorGaps: string[];
  platformLosses: { platform: string; previousShare: number; currentShare: number }[];
};

function normalizeCompetitorKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "")
    .trim();
}

function gapMentionsCompetitor(gap: string, competitors: string[]): boolean {
  const lower = gap.toLowerCase();
  return competitors.some((c) => {
    const key = normalizeCompetitorKey(c);
    if (!key) return false;
    const root = key.split(".")[0] ?? key;
    return lower.includes(key) || (root.length > 2 && lower.includes(root));
  });
}

function promptMap(results: PromptResult[]): Map<string, PromptResult> {
  const map = new Map<string, PromptResult>();
  for (const row of results) {
    map.set(row.prompt.trim().toLowerCase(), row);
  }
  return map;
}

export function buildCompetitorMoveDelta(input: {
  current: AuditPayload;
  previous: AuditPayload | null;
  trackedCompetitors: string[];
}): CompetitorMoveDelta {
  const previous = input.previous;
  if (!previous) {
    const competitorGaps = input.current.gaps.filter((g) =>
      gapMentionsCompetitor(g, input.trackedCompetitors),
    );
    return {
      hasChanges: competitorGaps.length > 0,
      scoreDelta: null,
      promptsLost: [],
      promptsWon: [],
      newCompetitorGaps: competitorGaps,
      platformLosses: [],
    };
  }

  const prevMap = promptMap(previous.promptResults);
  const currMap = promptMap(input.current.promptResults);

  const promptsLost: PromptResult[] = [];
  const promptsWon: PromptResult[] = [];

  for (const [key, prev] of prevMap) {
    const curr = currMap.get(key);
    if (prev.cited && curr && !curr.cited) {
      promptsLost.push(curr);
    }
  }

  for (const [key, curr] of currMap) {
    const prev = prevMap.get(key);
    if (curr.cited && (!prev || !prev.cited)) {
      promptsWon.push(curr);
    }
  }

  const previousGapSet = new Set(previous.gaps);
  const newCompetitorGaps = input.current.gaps.filter(
    (g) => !previousGapSet.has(g) && gapMentionsCompetitor(g, input.trackedCompetitors),
  );

  const platformLosses: CompetitorMoveDelta["platformLosses"] = [];
  for (const curr of input.current.platforms) {
    const prev = previous.platforms.find((p) => p.name === curr.name);
    if (prev?.present && !curr.present) {
      platformLosses.push({
        platform: curr.name,
        previousShare: prev.share,
        currentShare: curr.share,
      });
    } else if (prev && prev.share >= 28 && curr.share < prev.share - 15) {
      platformLosses.push({
        platform: curr.name,
        previousShare: prev.share,
        currentShare: curr.share,
      });
    }
  }

  const scoreDelta = input.current.score - previous.score;

  const hasChanges =
    promptsLost.length > 0 ||
    newCompetitorGaps.length > 0 ||
    platformLosses.length > 0;

  return {
    hasChanges,
    scoreDelta,
    promptsLost,
    promptsWon,
    newCompetitorGaps,
    platformLosses,
  };
}

export function buildDeltaFromAudits(
  current: AuditPayload,
  previous: AuditPayload | null,
  trackedCompetitors: string[],
): CompetitorMoveDelta {
  return buildCompetitorMoveDelta({
    current,
    previous,
    trackedCompetitors,
  });
}
