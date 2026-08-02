import type { AuditPayload, PromptResult } from "@/lib/api-types";
import { discoverCompetitorCandidates } from "@/lib/competitors/intelligence";

export type CompetitorMoveDelta = {
  hasChanges: boolean;
  scoreDelta: number | null;
  promptsLost: PromptResult[];
  promptsWon: PromptResult[];
  newCompetitorGaps: string[];
  platformLosses: { platform: string; previousShare: number; currentShare: number }[];
  competitorRateSurges: {
    competitor: string;
    previousRate: number;
    currentRate: number;
    delta: number;
  }[];
  newEntrantDomains: string[];
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

function safeGaps(audit: AuditPayload): string[] {
  return Array.isArray(audit.gaps)
    ? audit.gaps.filter((g): g is string => typeof g === "string")
    : [];
}

function safePlatforms(audit: AuditPayload) {
  return Array.isArray(audit.platforms) ? audit.platforms : [];
}

function promptMap(results: PromptResult[]): Map<string, PromptResult> {
  const map = new Map<string, PromptResult>();
  for (const row of results) {
    if (typeof row?.prompt !== "string") continue;
    map.set(row.prompt.trim().toLowerCase(), row);
  }
  return map;
}

function competitorCitationRate(
  results: PromptResult[],
  competitor: string,
  trackedCompetitors: string[],
): number {
  const total = results.length;
  if (total === 0) return 0;
  const normalized = normalizeCompetitorKey(competitor);
  const primary = normalizeCompetitorKey(trackedCompetitors[0] ?? competitor);
  if (normalized !== primary) return 0;
  const led = results.filter((pr) => !pr.cited).length;
  return Math.round((led / total) * 100);
}

function discoverEntrants(
  current: AuditPayload,
  previous: AuditPayload | null,
  trackedCompetitors: string[],
): string[] {
  const workspaceLike = {
    domain: current.domain,
    competitors: trackedCompetitors,
    promptResults: current.promptResults,
    gaps: current.gaps,
    hasRealAudit: true,
  } as Parameters<typeof discoverCompetitorCandidates>[0]["workspace"];

  const currentCandidates = discoverCompetitorCandidates({ workspace: workspaceLike })
    .map((c) => normalizeCompetitorKey(c.domain))
    .filter(Boolean);

  if (!previous) {
    return currentCandidates.slice(0, 3);
  }

  const prevWorkspaceLike = {
    domain: previous.domain,
    competitors: trackedCompetitors,
    promptResults: previous.promptResults,
    gaps: previous.gaps,
    hasRealAudit: true,
  } as Parameters<typeof discoverCompetitorCandidates>[0]["workspace"];

  const previousSet = new Set(
    discoverCompetitorCandidates({ workspace: prevWorkspaceLike }).map((c) =>
      normalizeCompetitorKey(c.domain),
    ),
  );

  return currentCandidates.filter((d) => !previousSet.has(d)).slice(0, 3);
}

export function buildCompetitorMoveDelta(input: {
  current: AuditPayload;
  previous: AuditPayload | null;
  trackedCompetitors: string[];
}): CompetitorMoveDelta {
  const previous = input.previous;
  if (!previous) {
    const competitorGaps = safeGaps(input.current).filter((g) =>
      gapMentionsCompetitor(g, input.trackedCompetitors),
    );
    return {
      hasChanges: competitorGaps.length > 0,
      scoreDelta: null,
      promptsLost: [],
      promptsWon: [],
      newCompetitorGaps: competitorGaps,
      platformLosses: [],
      competitorRateSurges: [],
      newEntrantDomains: discoverEntrants(
        input.current,
        null,
        input.trackedCompetitors,
      ),
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

  const previousGapSet = new Set(safeGaps(previous));
  const newCompetitorGaps = safeGaps(input.current).filter(
    (g) => !previousGapSet.has(g) && gapMentionsCompetitor(g, input.trackedCompetitors),
  );

  const platformLosses: CompetitorMoveDelta["platformLosses"] = [];
  for (const curr of safePlatforms(input.current)) {
    const prev = safePlatforms(previous).find((p) => p.name === curr.name);
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

  const competitorRateSurges: CompetitorMoveDelta["competitorRateSurges"] = [];
  for (const competitor of input.trackedCompetitors) {
    const prevRate = competitorCitationRate(
      previous.promptResults,
      competitor,
      input.trackedCompetitors,
    );
    const currRate = competitorCitationRate(
      input.current.promptResults,
      competitor,
      input.trackedCompetitors,
    );
    const delta = currRate - prevRate;
    if (delta > 10) {
      competitorRateSurges.push({
        competitor,
        previousRate: prevRate,
        currentRate: currRate,
        delta,
      });
    }
  }

  const newEntrantDomains = discoverEntrants(
    input.current,
    previous,
    input.trackedCompetitors,
  );

  const hasChanges =
    promptsLost.length > 0 ||
    newCompetitorGaps.length > 0 ||
    platformLosses.length > 0 ||
    competitorRateSurges.length > 0 ||
    newEntrantDomains.length > 0;

  return {
    hasChanges,
    scoreDelta,
    promptsLost,
    promptsWon,
    newCompetitorGaps,
    platformLosses,
    competitorRateSurges,
    newEntrantDomains,
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
