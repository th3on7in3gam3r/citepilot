import { brandFromDomain } from "@/lib/audit/site-analyzer";
import type { WorkspaceSnapshotResponse } from "@/lib/api-types";
import {
  googleSearchConfigured,
  searchGoogle,
  type GoogleOrganicHit,
  type GoogleSearchResponse,
} from "@/lib/search/google";

const MAX_QUERIES = 3;
const SERP_TIMEOUT_MS = 8_000;
const ORGANIC_LIMIT = 5;

export type SerpOrganicRow = {
  position: number;
  title?: string;
  link?: string;
  snippet?: string;
  isBrand: boolean;
};

export type SerpQueryResult = {
  query: string;
  provider?: "serper" | "serpapi";
  brandRank: number | null;
  domainVisible: boolean;
  aiOverview?: string;
  answerBox?: string;
  organic: SerpOrganicRow[];
};

export type SerpContextPayload = {
  available: boolean;
  queries: SerpQueryResult[];
};

function normalizeDomain(domain: string): string {
  return domain.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] ?? domain;
}

function domainMatches(link: string | undefined, domain: string): boolean {
  if (!link) return false;
  try {
    const host = new URL(link).hostname.replace(/^www\./, "").toLowerCase();
    const target = normalizeDomain(domain).toLowerCase();
    return host === target || host.endsWith(`.${target}`);
  } catch {
    return link.toLowerCase().includes(normalizeDomain(domain).toLowerCase());
  }
}

function textMentionsBrand(text: string, domain: string, brand: string): boolean {
  const lower = text.toLowerCase();
  const domainClean = normalizeDomain(domain).toLowerCase();
  const root = domainClean.split(".")[0] ?? "";
  return (
    lower.includes(domainClean) ||
    lower.includes(brand.toLowerCase()) ||
    (root.length > 2 && lower.includes(root))
  );
}

/** Rank of the brand domain in organic results (1-based), or null if not found. */
export function domainRankInSerp(
  domain: string,
  organic: GoogleOrganicHit[],
): number | null {
  const target = normalizeDomain(domain).toLowerCase();
  for (const row of organic) {
    if (row.position != null && domainMatches(row.link, target)) {
      return row.position;
    }
  }
  for (let i = 0; i < organic.length; i++) {
    if (domainMatches(organic[i]?.link, target)) {
      return organic[i]?.position ?? i + 1;
    }
  }
  return null;
}

/** Build up to 3 Google queries from workspace audit data. */
export function buildSerpQueries(snapshot: WorkspaceSnapshotResponse): string[] {
  const queries: string[] = [];
  const seen = new Set<string>();

  function add(q: string | undefined | null) {
    const trimmed = q?.trim();
    if (!trimmed || trimmed.length < 4) return;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    queries.push(trimmed);
  }

  add(snapshot.buyerQuestion);

  const uncited = (snapshot.promptResults ?? []).filter((p) => p && !p.cited);
  const cited = (snapshot.promptResults ?? []).filter((p) => p?.cited);

  for (const row of uncited.slice(0, 2)) {
    add(row.prompt);
    if (queries.length >= MAX_QUERIES) break;
  }

  if (queries.length < MAX_QUERIES && cited[0]) {
    add(cited[0].prompt);
  }

  const competitors = (snapshot.competitors ?? []).slice(0, 2);
  const brand = brandFromDomain(snapshot.domain);
  if (queries.length < MAX_QUERIES && competitors[0]) {
    add(`${brand} vs ${competitors[0]}`);
  }

  return queries.slice(0, MAX_QUERIES);
}

function mapOrganicRows(
  result: GoogleSearchResponse,
  domain: string,
  brand: string,
): SerpOrganicRow[] {
  return result.organic.slice(0, ORGANIC_LIMIT).map((row, index) => {
    const position = row.position ?? index + 1;
    const snippet = row.snippet ?? "";
    const title = row.title ?? "";
    const isBrand =
      domainMatches(row.link, domain) ||
      textMentionsBrand(`${title} ${snippet}`, domain, brand);

    return {
      position,
      title: row.title,
      link: row.link,
      snippet: row.snippet,
      isBrand,
    };
  });
}

function mapSearchResult(
  query: string,
  result: GoogleSearchResponse,
  domain: string,
  brand: string,
): SerpQueryResult {
  const organic = mapOrganicRows(result, domain, brand);
  const brandRank = domainRankInSerp(domain, result.organic);
  const domainVisible =
    brandRank != null ||
    organic.some((row) => row.isBrand) ||
    Boolean(result.aiOverviewText && textMentionsBrand(result.aiOverviewText, domain, brand)) ||
    Boolean(result.answerBoxSnippet && textMentionsBrand(result.answerBoxSnippet, domain, brand));

  return {
    query,
    provider: result.provider,
    brandRank,
    domainVisible,
    aiOverview: result.aiOverviewText?.slice(0, 600),
    answerBox: result.answerBoxSnippet?.slice(0, 400),
    organic,
  };
}

/** Fetch live Google SERP snapshots for LLM grounding (Serper or SerpAPI). */
export async function fetchSerpContext(
  snapshot: WorkspaceSnapshotResponse,
): Promise<SerpContextPayload> {
  if (!googleSearchConfigured()) {
    return { available: false, queries: [] };
  }

  const queries = buildSerpQueries(snapshot);
  if (queries.length === 0) {
    return { available: true, queries: [] };
  }

  const domain = snapshot.domain;
  const brand = brandFromDomain(domain);

  const results = await Promise.all(
    queries.map(async (query) => {
      try {
        const result = await searchGoogle(query, {
          num: 8,
          signal: AbortSignal.timeout(SERP_TIMEOUT_MS),
        });
        if (!result) return null;
        return mapSearchResult(query, result, domain, brand);
      } catch {
        return null;
      }
    }),
  );

  return {
    available: true,
    queries: results.filter((row): row is SerpQueryResult => row != null),
  };
}

/** Merge live SERP data into a workspace context JSON string for LLM prompts. */
export function attachSerpToContextJson(
  contextJson: string,
  serp: SerpContextPayload,
): string {
  if (!serp.available || serp.queries.length === 0) {
    return contextJson;
  }

  const base = JSON.parse(contextJson) as Record<string, unknown>;
  return JSON.stringify({ ...base, liveSerp: serp }, null, 2);
}
