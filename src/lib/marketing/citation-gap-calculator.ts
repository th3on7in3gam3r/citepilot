import { domainSeed } from "@/lib/dashboard";

export const calculatorIndustries = [
  { id: "saas", label: "B2B SaaS", trafficMultiplier: 1.4 },
  { id: "agency", label: "Agency / Consultant", trafficMultiplier: 1.1 },
  { id: "ecommerce", label: "Ecommerce / D2C", trafficMultiplier: 1.25 },
  { id: "devtools", label: "DevTools / API", trafficMultiplier: 1.35 },
  { id: "health", label: "Health / Wellness", trafficMultiplier: 1.15 },
  { id: "other", label: "Other", trafficMultiplier: 1.0 },
] as const;

export type CitationGapEstimate = {
  estimatedCurrentRate: number;
  estimatedGap: number;
  monthlyOpportunityVisits: number;
  competitorPressure: "low" | "medium" | "high";
  topFix: string;
};

/** Deterministic illustrative estimate — not a live audit. */
export function estimateCitationGap(input: {
  domain: string;
  industryId: string;
  competitors: string;
}): CitationGapEstimate {
  const cleanDomain = input.domain
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "")
    .trim()
    .toLowerCase();
  const hash = cleanDomain ? domainSeed(cleanDomain) : 42;

  const competitorList = input.competitors
    .split(/[,\n]/)
    .map((c) => c.trim())
    .filter(Boolean);
  const compCount = competitorList.length;

  const industry =
    calculatorIndustries.find((i) => i.id === input.industryId) ??
    calculatorIndustries.find((i) => i.id === "other")!;

  const estimatedCurrentRate = Math.min(
    72,
    Math.max(8, 18 + (hash % 28) - compCount * 3),
  );
  const estimatedGap = Math.min(
    88,
    Math.max(12, 78 - estimatedCurrentRate + compCount * 6),
  );

  const monthlyOpportunityVisits = Math.round(
    estimatedGap * industry.trafficMultiplier * (90 + (hash % 160)),
  );

  const competitorPressure =
    compCount >= 4 ? "high" : compCount >= 2 ? "medium" : "low";

  const topFix =
    estimatedCurrentRate < 25
      ? "Add an answer capsule + FAQPage schema on your homepage"
      : estimatedCurrentRate < 45
        ? "Publish comparison content for your top money prompt"
        : "Earn third-party mentions on trusted industry sources";

  return {
    estimatedCurrentRate,
    estimatedGap,
    monthlyOpportunityVisits,
    competitorPressure,
    topFix,
  };
}
