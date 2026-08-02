import { searchGoogle, googleSearchConfigured } from "@/lib/search/google";
import type {
  CompetitorCitation,
  GapReason,
  MoneyPromptBrand,
  MoneyPromptEngine,
} from "@/lib/money-prompts/types";

export type GapCheckResult = {
  engine: MoneyPromptEngine;
  brandCited: boolean;
  competitorsCited: CompetitorCitation[];
  gapReason: GapReason | null;
  suggestedFix: string;
  priority: 1 | 2 | 3 | 4 | 5;
};

function normalizeDomain(domain: string): string {
  return domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]!;
}

export function isBrandCited(
  domain: string,
  sources: { link?: string; url?: string; snippet?: string; name?: string }[],
): boolean {
  const needle = normalizeDomain(domain);
  if (!needle) return false;
  return sources.some((s) => {
    const hay = `${s.link ?? ""} ${s.url ?? ""} ${s.snippet ?? ""} ${s.name ?? ""}`.toLowerCase();
    return hay.includes(needle);
  });
}

export function diagnoseGapReason(
  competitorsCited: CompetitorCitation[],
): GapReason {
  if (competitorsCited.length === 0) return "thin-authority";
  const hasComparisonPage = competitorsCited.some((c) =>
    /vs|compare|alternative/i.test(c.url),
  );
  if (hasComparisonPage) return "no-comparison-page";
  return "no-content";
}

export function suggestFix(
  reason: GapReason,
  brand: MoneyPromptBrand,
  query: string,
): string {
  const fixes: Record<GapReason, string> = {
    "no-content": `Publish a dedicated page targeting "${query}" with a direct, quotable answer in the first 100 words.`,
    "weak-schema": `Add FAQPage or Product schema (JSON-LD) to the relevant ${brand.domain} page so engines can parse the answer directly.`,
    "missing-llms-txt": `Add an /llms.txt entry pointing engines to your canonical answer page for this query.`,
    "thin-authority": `Get cited by 2-3 third-party sources (reviews, comparison roundups, directories) that AI engines already trust for this query.`,
    "no-comparison-page": `Build a "${brand.name} vs [competitor]" comparison page — competitors are winning this exact query pattern.`,
    "stale-content": `Refresh the existing page's date, stats, and examples — engines are favoring more recently updated sources.`,
  };
  return fixes[reason];
}

async function checkGoogleAiOverview(
  brand: MoneyPromptBrand,
  query: string,
): Promise<GapCheckResult | null> {
  if (!googleSearchConfigured()) return null;
  try {
    const result = await searchGoogle(query, { num: 8 });
    if (!result) return null;
    const sources = result.organic ?? [];
    const brandCited = isBrandCited(brand.domain, sources);
    const competitorsCited: CompetitorCitation[] = sources
      .filter((s) => !isBrandCited(brand.domain, [s]))
      .slice(0, 5)
      .map((s) => ({
        name: s.title ?? "unknown",
        url: s.link ?? "",
        snippet: s.snippet ?? "",
      }));
    const gapReason = brandCited ? null : diagnoseGapReason(competitorsCited);
    return {
      engine: "google-ai-overview",
      brandCited,
      competitorsCited,
      gapReason,
      suggestedFix: gapReason ? suggestFix(gapReason, brand, query) : "",
      priority: brandCited ? 5 : competitorsCited.length > 3 ? 1 : 2,
    };
  } catch {
    return null;
  }
}

async function checkPerplexity(
  brand: MoneyPromptBrand,
  query: string,
): Promise<GapCheckResult | null> {
  const key = process.env.PERPLEXITY_API_KEY?.trim();
  if (!key) return null;
  try {
    const res = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.PERPLEXITY_MODEL ?? "sonar",
        messages: [{ role: "user", content: query }],
        max_tokens: 450,
        temperature: 0.2,
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
      citations?: string[];
    };
    const text = data.choices?.[0]?.message?.content ?? "";
    const citationUrls = (data.citations ?? []).filter(
      (u): u is string => typeof u === "string",
    );
    const sources = citationUrls.map((url) => ({
      url,
      link: url,
      name: url,
      snippet: text.slice(0, 200),
    }));
    // Also scan answer text for domain mentions
    sources.push({
      url: "",
      link: "",
      name: "answer",
      snippet: text,
    });
    const brandCited = isBrandCited(brand.domain, sources);
    const competitorsCited: CompetitorCitation[] = citationUrls
      .filter((url) => !url.toLowerCase().includes(normalizeDomain(brand.domain)))
      .slice(0, 5)
      .map((url) => ({ name: url, url, snippet: "" }));
    const gapReason = brandCited ? null : diagnoseGapReason(competitorsCited);
    return {
      engine: "perplexity",
      brandCited,
      competitorsCited,
      gapReason,
      suggestedFix: gapReason ? suggestFix(gapReason, brand, query) : "",
      priority: brandCited ? 5 : competitorsCited.length > 3 ? 1 : 2,
    };
  } catch {
    return null;
  }
}

async function checkGemini(
  brand: MoneyPromptBrand,
  query: string,
): Promise<GapCheckResult | null> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) return null;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: query }] }],
          tools: [{ google_search: {} }],
        }),
        signal: AbortSignal.timeout(25_000),
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      candidates?: {
        content?: { parts?: { text?: string }[] };
        groundingMetadata?: {
          groundingChunks?: { web?: { title?: string; uri?: string } }[];
        };
      }[];
    };
    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const chunks =
      data.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    const citations: CompetitorCitation[] = chunks.map((c) => ({
      name: c.web?.title ?? "unknown",
      url: c.web?.uri ?? "",
      snippet: "",
    }));
    const brandCited =
      isBrandCited(brand.domain, citations) ||
      isBrandCited(brand.domain, [{ snippet: text }]);
    const competitorsCited = citations
      .filter((c) => !c.url.toLowerCase().includes(normalizeDomain(brand.domain)))
      .slice(0, 5);
    const gapReason = brandCited ? null : diagnoseGapReason(competitorsCited);
    return {
      engine: "gemini",
      brandCited,
      competitorsCited,
      gapReason,
      suggestedFix: gapReason ? suggestFix(gapReason, brand, query) : "",
      priority: brandCited ? 5 : competitorsCited.length > 3 ? 1 : 2,
    };
  } catch {
    return null;
  }
}

/**
 * Runs a query against configured engines to determine citation presence.
 * Engines without API keys are skipped.
 */
export async function analyzeCitationGap(input: {
  brand: MoneyPromptBrand;
  query: string;
}): Promise<GapCheckResult[]> {
  const { brand, query } = input;
  const settled = await Promise.allSettled([
    checkGoogleAiOverview(brand, query),
    checkPerplexity(brand, query),
    checkGemini(brand, query),
  ]);

  const results: GapCheckResult[] = [];
  for (const item of settled) {
    if (item.status === "fulfilled" && item.value) {
      results.push(item.value);
    }
  }
  return results;
}
