import type {
  PlatformPresence,
  PromptResult,
  SiteSignals,
} from "@/lib/api-types";

export function defaultSiteSignals(geoScore = 0): SiteSignals {
  return {
    title: null,
    metaDescription: null,
    h1: null,
    wordCount: 0,
    hasJsonLd: false,
    hasFaqSchema: false,
    hasOrganizationSchema: false,
    hasOgTags: false,
    robotsAllows: true,
    sitemapFound: false,
    fetchOk: false,
    geoScore,
  };
}

export function parseSiteSignals(
  raw: unknown,
  fallbackScore: number,
): SiteSignals {
  if (!raw || typeof raw !== "object") {
    return defaultSiteSignals(fallbackScore);
  }
  const partial = raw as Partial<SiteSignals>;
  const base = defaultSiteSignals(fallbackScore);
  return {
    ...base,
    ...partial,
    geoScore:
      typeof partial.geoScore === "number" ? partial.geoScore : fallbackScore,
  };
}

export function parseJsonArray<T>(
  raw: string | number | null | undefined,
  fallback: T[] = [],
): T[] {
  if (raw == null || raw === "") return fallback;
  try {
    const value = JSON.parse(String(raw));
    return Array.isArray(value) ? (value as T[]) : fallback;
  } catch {
    return fallback;
  }
}

export function parsePlatforms(
  raw: string | number | null | undefined,
): PlatformPresence[] {
  return parseJsonArray<PlatformPresence>(raw);
}

export function parsePromptResults(
  raw: string | number | null | undefined,
): PromptResult[] {
  return parseJsonArray<PromptResult>(raw);
}

export function parseGaps(raw: string | number | null | undefined): string[] {
  const gaps = parseJsonArray<string>(raw);
  return gaps.filter((g) => typeof g === "string");
}
