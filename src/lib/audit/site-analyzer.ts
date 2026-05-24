import type { SiteSignals } from "@/lib/api-types";

export function normalizeDomain(input: string): string {
  return input
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/.*$/, "")
    .toLowerCase();
}

export function brandFromDomain(domain: string): string {
  const root = domain.split(".")[0] ?? domain;
  return root.replace(/[-_]/g, " ");
}

async function fetchText(
  url: string,
  timeoutMs = 8000,
): Promise<{ ok: boolean; text: string; status: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "CitePilot-Audit/1.0 (+https://getcitepilot.com)",
        Accept: "text/html,application/xhtml+xml,text/plain,*/*",
      },
      redirect: "follow",
    });
    const text = await res.text();
    return { ok: res.ok, text, status: res.status };
  } catch {
    return { ok: false, text: "", status: 0 };
  } finally {
    clearTimeout(timer);
  }
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function firstMatch(html: string, pattern: RegExp): string | null {
  const match = html.match(pattern);
  return match?.[1]?.trim() ?? null;
}

function analyzeHtml(html: string): Omit<SiteSignals, "robotsAllows" | "sitemapFound" | "fetchOk" | "geoScore"> {
  const title = firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const metaDescription = firstMatch(
    html,
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
  ) ?? firstMatch(html, /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
  const h1 = firstMatch(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const text = stripTags(html);
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  const jsonLdBlocks =
    html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
      ?.join("\n") ?? "";
  const hasJsonLd = jsonLdBlocks.length > 0;
  const hasFaqSchema = /FAQPage|"@type"\s*:\s*"FAQPage"/i.test(jsonLdBlocks);
  const hasOrganizationSchema =
    /Organization|"@type"\s*:\s*"Organization"/i.test(jsonLdBlocks);
  const hasOgTags =
    /<meta[^>]+property=["']og:(title|description|image)["']/i.test(html);

  return {
    title: title ? stripTags(title) : null,
    metaDescription,
    h1: h1 ? stripTags(h1) : null,
    wordCount,
    hasJsonLd,
    hasFaqSchema,
    hasOrganizationSchema,
    hasOgTags,
  };
}

function computeGeoScore(
  signals: Omit<SiteSignals, "geoScore">,
): number {
  let score = 0;
  if (signals.fetchOk) score += 10;
  if (signals.title) score += 12;
  if (signals.metaDescription) score += 12;
  if (signals.h1) score += 8;
  if (signals.wordCount >= 300) score += 10;
  if (signals.wordCount >= 800) score += 5;
  if (signals.hasJsonLd) score += 15;
  if (signals.hasOrganizationSchema) score += 8;
  if (signals.hasFaqSchema) score += 10;
  if (signals.hasOgTags) score += 5;
  if (signals.robotsAllows) score += 8;
  if (signals.sitemapFound) score += 7;
  return Math.min(100, score);
}

async function checkRobots(domain: string): Promise<boolean> {
  const { ok, text } = await fetchText(`https://${domain}/robots.txt`, 5000);
  if (!ok) return true;
  const lower = text.toLowerCase();
  if (!lower.includes("user-agent")) return true;
  return !/user-agent:\s*\*[\s\S]*?disallow:\s*\//i.test(lower);
}

async function checkSitemap(domain: string): Promise<boolean> {
  const { ok } = await fetchText(`https://${domain}/sitemap.xml`, 5000);
  return ok;
}

export async function analyzeSite(domainInput: string): Promise<SiteSignals> {
  const domain = normalizeDomain(domainInput);
  const homepage = await fetchText(`https://${domain}`);
  const httpFallback =
    homepage.ok || homepage.status !== 0
      ? homepage
      : await fetchText(`http://${domain}`);

  const html = httpFallback.text;
  const parsed = analyzeHtml(html);

  const [robotsAllows, sitemapFound] = await Promise.all([
    checkRobots(domain),
    checkSitemap(domain),
  ]);

  const partial: Omit<SiteSignals, "geoScore"> = {
    ...parsed,
    robotsAllows,
    sitemapFound,
    fetchOk: httpFallback.ok && html.length > 100,
  };

  return {
    ...partial,
    geoScore: computeGeoScore(partial),
  };
}

export function promptOverlap(prompt: string, corpus: string): number {
  const stop = new Set([
    "the",
    "a",
    "an",
    "for",
    "to",
    "and",
    "or",
    "in",
    "on",
    "with",
    "your",
    "best",
    "how",
    "what",
    "is",
    "are",
  ]);
  const tokens = prompt
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !stop.has(t));
  if (tokens.length === 0) return 0;
  const hay = corpus.toLowerCase();
  const hits = tokens.filter((t) => hay.includes(t)).length;
  return hits / tokens.length;
}

export function buildGapsFromSignals(
  signals: SiteSignals,
  promptResults: { prompt: string; cited: boolean }[],
  domain: string,
): string[] {
  const gaps: string[] = [];
  if (!signals.fetchOk) {
    gaps.push(`Homepage at ${domain} could not be fetched — check SSL and uptime`);
  }
  if (!signals.metaDescription) {
    gaps.push("Missing meta description — AI systems use this for entity summaries");
  }
  if (!signals.hasJsonLd) {
    gaps.push("No JSON-LD structured data detected on the homepage");
  }
  if (!signals.hasFaqSchema) {
    gaps.push("Missing FAQPage schema — high-impact for AI answer extraction");
  }
  if (!signals.hasOrganizationSchema) {
    gaps.push("No Organization schema — weakens brand entity recognition");
  }
  if (!signals.h1) {
    gaps.push("No H1 heading found — unclear primary topic for crawlers");
  }
  if (signals.wordCount < 300) {
    gaps.push("Thin homepage content (<300 words) — add an answer capsule above the fold");
  }
  if (!signals.sitemapFound) {
    gaps.push("No sitemap.xml found — harder for AI crawlers to discover pages");
  }
  if (!signals.robotsAllows) {
    gaps.push("robots.txt may block crawlers — verify AI bot access");
  }
  for (const pr of promptResults.filter((p) => !p.cited)) {
    gaps.push(`On-site content doesn't support prompt: "${pr.prompt.slice(0, 80)}${pr.prompt.length > 80 ? "…" : ""}"`);
  }
  return gaps.slice(0, 8);
}
