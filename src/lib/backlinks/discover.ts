import type { BacklinkSource } from "@/lib/backlinks/types";
import {
  googleSearchConfigured,
  searchGoogle,
  webDiscoveryConfigured,
} from "@/lib/search/google";

const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function profileIsStale(discoveredAt: string | null): boolean {
  if (!discoveredAt) return true;
  return Date.now() - new Date(discoveredAt).getTime() > CACHE_MAX_AGE_MS;
}

function hostFromUrl(raw: string): string {
  try {
    return new URL(raw).hostname.replace(/^www\./, "");
  } catch {
    return raw;
  }
}

function dedupeSources(items: BacklinkSource[]): BacklinkSource[] {
  const seen = new Set<string>();
  const out: BacklinkSource[] = [];
  for (const item of items) {
    const key = item.url.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

async function fetchGoogleBacklinks(domain: string): Promise<BacklinkSource[]> {
  if (!googleSearchConfigured()) return [];

  const queries = [`"${domain}" -site:${domain}`, `link:${domain}`];
  const results: BacklinkSource[] = [];

  for (const q of queries) {
    const data = await searchGoogle(q, { num: 10 });
    if (!data) continue;

    const sourceTag = data.provider;
    for (const item of data.organic) {
      if (!item.link) continue;
      const sourceDomain = hostFromUrl(item.link);
      if (sourceDomain === domain.replace(/^www\./, "")) continue;
      results.push({
        id: `${sourceTag}-${encodeURIComponent(item.link)}`,
        url: item.link,
        title: item.title ?? sourceDomain,
        sourceDomain,
        discoverySource: sourceTag,
      });
    }
  }

  return results;
}

async function fetchTavilyBacklinks(domain: string): Promise<BacklinkSource[]> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) return [];

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: key,
      query: `websites linking to or mentioning ${domain}`,
      max_results: 10,
      include_domains: [],
    }),
    cache: "no-store",
  });
  if (!res.ok) return [];

  const data = (await res.json()) as {
    results?: { title?: string; url?: string }[];
  };

  return (data.results ?? [])
    .filter((r) => r.url)
    .map((r) => {
      const url = r.url!;
      const sourceDomain = hostFromUrl(url);
      return {
        id: `tavily-${encodeURIComponent(url)}`,
        url,
        title: r.title ?? sourceDomain,
        sourceDomain,
        discoverySource: "tavily" as const,
      };
    })
    .filter((r) => r.sourceDomain !== domain.replace(/^www\./, ""));
}

export async function fetchOpenPageRank(
  domain: string,
): Promise<number | null> {
  const key = process.env.OPEN_PAGERANK_API_KEY?.trim();
  if (!key) return null;

  const clean = domain.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  const res = await fetch(
    `https://openpagerank.com/api/v1.0/getPageRank?domains[]=${encodeURIComponent(clean)}`,
    {
      headers: { "API-OPR": key },
      cache: "no-store",
    },
  );
  if (!res.ok) return null;

  const data = (await res.json()) as {
    response?: { domain?: string; page_rank_decimal?: number; rank?: string }[];
  };
  const row = data.response?.[0];
  if (!row?.page_rank_decimal && row?.page_rank_decimal !== 0) return null;
  return row.page_rank_decimal;
}

export function computeDomainRating(input: {
  openPageRank: number | null;
  geoScore: number | null;
  referringCount: number;
}): number {
  const fromOpr =
    input.openPageRank != null
      ? Math.round(Math.min(99, input.openPageRank * 10))
      : null;
  const fromGeo =
    input.geoScore != null
      ? Math.min(99, Math.round(input.geoScore * 0.7))
      : null;
  const fromRefs = Math.min(40, Math.round(Math.log10(input.referringCount + 1) * 18));

  if (fromOpr != null && fromGeo != null) {
    return Math.min(99, Math.round(fromOpr * 0.55 + fromGeo * 0.25 + fromRefs * 0.2));
  }
  if (fromOpr != null) {
    return Math.min(99, Math.round(fromOpr * 0.75 + fromRefs * 0.25));
  }
  if (fromGeo != null) {
    return Math.min(99, Math.round(fromGeo * 0.65 + fromRefs * 0.35));
  }
  return Math.min(99, 12 + fromRefs);
}

export function competitorSources(
  domain: string,
  competitors: string[],
): BacklinkSource[] {
  return competitors
    .map((c) => c.trim())
    .filter(Boolean)
    .slice(0, 8)
    .map((comp) => {
      const host = comp.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
      const url = comp.startsWith("http") ? comp : `https://${host}`;
      return {
        id: `competitor-${encodeURIComponent(host)}`,
        url,
        title: `${host} — tracked competitor`,
        sourceDomain: host,
        discoverySource: "competitor" as const,
      };
    })
    .filter((s) => s.sourceDomain !== domain.replace(/^www\./, ""));
}

export async function discoverBacklinkSources(input: {
  domain: string;
  competitors: string[];
}): Promise<BacklinkSource[]> {
  const [google, tavily] = await Promise.all([
    fetchGoogleBacklinks(input.domain),
    fetchTavilyBacklinks(input.domain),
  ]);

  return dedupeSources([
    ...google,
    ...tavily,
    ...competitorSources(input.domain, input.competitors),
  ]).slice(0, 30);
}

export function searchConfigured(): boolean {
  return webDiscoveryConfigured();
}

export function openPageRankConfigured(): boolean {
  return Boolean(process.env.OPEN_PAGERANK_API_KEY?.trim());
}
