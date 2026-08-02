import { domainSeed } from "@/lib/dashboard";

export const calculatorIndustries = [
  { id: "saas", label: "B2B SaaS" },
  { id: "agency", label: "Agency" },
  { id: "ecommerce", label: "Ecommerce" },
  { id: "local", label: "Local" },
  { id: "other", label: "Other" },
] as const;

export type CalculatorIndustryId = (typeof calculatorIndustries)[number]["id"];

type IndustryBenchmark = {
  /** Typical share of industry brands cited on ≥1 major AI platform */
  avgCitationRate: number;
  /** Estimated share of discovery queries answered by AI assistants */
  aiSearchShare: number;
};

const INDUSTRY_BENCHMARKS: Record<CalculatorIndustryId, IndustryBenchmark> = {
  saas: { avgCitationRate: 0.44, aiSearchShare: 0.15 },
  agency: { avgCitationRate: 0.38, aiSearchShare: 0.12 },
  ecommerce: { avgCitationRate: 0.36, aiSearchShare: 0.14 },
  local: { avgCitationRate: 0.28, aiSearchShare: 0.18 },
  other: { avgCitationRate: 0.35, aiSearchShare: 0.13 },
};

export type CitationGapEstimate = {
  estimatedCurrentRate: number;
  estimatedGap: number;
  monthlyOpportunityVisits: number;
  gapVsCategoryPct: number;
  projectedLift90d: number;
  competitorPressure: "low" | "medium" | "high";
  topFix: string;
};

/**
 * Illustrative ROI model — not a live audit.
 *
 * Formula:
 *   user_citation_rate = platforms_cited / 8
 *   gap_rate = max(0, industry_avg_citation_rate - user_citation_rate)
 *   missed_visitors = monthly_traffic × ai_search_share × (gap_rate / industry_avg_citation_rate)
 *   gap_vs_category_pct = round((gap_rate / industry_avg_citation_rate) × 100)
 *   projected_lift_90d = min(round(gap_vs_category_pct × 0.45), 45)
 *
 * Competitor domain adds deterministic pressure modifier via domain hash.
 */
export function estimateCitationGap(input: {
  industryId: string;
  monthlyTraffic: number;
  platformsCited: number;
  competitorDomain?: string;
}): CitationGapEstimate {
  const industryId = (calculatorIndustries.some((i) => i.id === input.industryId)
    ? input.industryId
    : "other") as CalculatorIndustryId;

  const bench = INDUSTRY_BENCHMARKS[industryId];
  const traffic = Math.max(0, input.monthlyTraffic);
  const platforms = Math.min(8, Math.max(0, Math.round(input.platformsCited)));

  const userRate = platforms / 8;
  const gapRate = Math.max(0, bench.avgCitationRate - userRate);
  const gapVsCategoryPct = Math.round(
    (gapRate / Math.max(bench.avgCitationRate, 0.01)) * 100,
  );

  const competitor = input.competitorDomain
    ?.replace(/^https?:\/\//, "")
    .replace(/\/$/, "")
    .trim()
    .toLowerCase();
  const compHash = competitor ? domainSeed(competitor) % 5 : 0;
  const competitorPressure =
    competitor && compHash >= 3 ? "high" : competitor ? "medium" : "low";

  const pressureMultiplier =
    competitorPressure === "high" ? 1.12 : competitorPressure === "medium" ? 1.06 : 1;

  const monthlyOpportunityVisits = Math.round(
    traffic *
      bench.aiSearchShare *
      (gapRate / Math.max(bench.avgCitationRate, 0.01)) *
      pressureMultiplier,
  );

  const estimatedCurrentRate = Math.round(userRate * 100);
  const estimatedGap = gapVsCategoryPct;
  const projectedLift90d = Math.min(Math.round(gapVsCategoryPct * 0.45), 45);

  const topFix =
    platforms <= 1
      ? "Add FAQPage schema + a 40–60 word answer capsule on your homepage"
      : platforms <= 3
        ? "Publish a comparison page for your top money prompt"
        : "Earn third-party mentions on G2, Reddit, and industry directories";

  return {
    estimatedCurrentRate,
    estimatedGap,
    monthlyOpportunityVisits,
    gapVsCategoryPct,
    projectedLift90d,
    competitorPressure,
    topFix,
  };
}

export const citationGapFormulaExplanation = [
  "We compare your self-reported platform count (0–8) to an industry-average citation rate benchmark.",
  "Missed AI discovery = monthly traffic × AI search share × your gap vs the category average.",
  "Competitor domain adds a small pressure modifier — start workspace setup for live citation data.",
] as const;
