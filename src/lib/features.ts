export type ProductFeature = {
  id: string;
  title: string;
  description: string;
  dashboardHref?: string;
};

/** Core CitePilot feature suite — maps to dashboard modules. */
export const productFeatures: ProductFeature[] = [
  {
    id: "content",
    title: "Branded SEO Content",
    description:
      "Generates brand-aligned articles optimized for search and AI visibility. Structured to rank, attract traffic, and build authority.",
    dashboardHref: "/dashboard/content",
  },
  {
    id: "strategy",
    title: "30–Day Content Strategy",
    description:
      "Plans a full month of content based on ranking and citation trends. Topics and formats chosen to maximize discoverability.",
    dashboardHref: "/dashboard/content",
  },
  {
    id: "publishing",
    title: "Automated Publishing",
    description:
      "Publish from your article queue to Webflow, WordPress, Ghost, Shopify, or Framer.",
    dashboardHref: "/dashboard/content",
  },
  {
    id: "backlinks",
    title: "Authority Backlinks",
    description:
      "Builds contextual backlinks through a trusted network. Strengthens authority and improves search and AI rankings.",
    dashboardHref: "/dashboard/backlinks",
  },
  {
    id: "geo-audit",
    title: "Technical GEO Audit",
    description:
      "Scans your site for technical gaps affecting visibility. Identifies issues in schema, metadata, and structure that impact rankings.",
    dashboardHref: "/dashboard/geo-audit",
  },
  {
    id: "discussions",
    title: "Buyer Discussion Radar",
    description:
      "Surfaces high-intent threads on Hacker News and Stack Overflow — where technical buyers ask real questions, not generic Reddit scrapes.",
    dashboardHref: "/dashboard/discussions",
  },
  {
    id: "llm-tracking",
    title: "LLM Visibility Tracking",
    description:
      "Tracks brand mentions across ChatGPT, Perplexity, Grok, DeepSeek, and other AI answer surfaces. Measures citation growth and visibility trends over time.",
    dashboardHref: "/dashboard/analytics",
  },
];

export type CmsPlatform = {
  id: string;
  name: string;
  /** Live publish integration in CitePilot */
  available: boolean;
};

export const cmsPlatforms: CmsPlatform[] = [
  { id: "webflow", name: "Webflow", available: true },
  { id: "wordpress", name: "WordPress", available: true },
  { id: "shopify", name: "Shopify", available: true },
  { id: "ghost", name: "Ghost", available: true },
  { id: "framer", name: "Framer", available: true },
];

export const llmModels = [
  { id: "chatgpt", label: "ChatGPT", short: "GPT" },
  { id: "claude", label: "Claude", short: "Cl" },
  { id: "perplexity", label: "Perplexity", short: "Px" },
  { id: "gemini", label: "Gemini", short: "Ge" },
  { id: "grok", label: "Grok", short: "Gr" },
  { id: "deepseek", label: "DeepSeek", short: "Ds" },
] as const;

export type PromptRow = {
  prompt: string;
  /** Null when visibility has not been measured (no audit yet). */
  visibility: number | null;
  models: string[];
  sentiment: "Positive" | "Neutral" | "Negative";
  leader: string;
  cited?: boolean;
  fromAudit?: boolean;
};

export function buildPromptRows(buyerQuestion: string, seed: number): PromptRow[] {
  const base = buyerQuestion || "best tool for [your category]";
  const extras = [
    "alternatives to [competitor]",
    "how to choose [product type]",
    "is [brand] worth it for teams",
    "top rated [category] software 2026",
  ];

  return [base, ...extras].map((prompt, i) => ({
    prompt,
    visibility: Math.max(12, 55 - i * 9 + (seed % 7)),
    models: llmModels.slice(0, 2 + (i % 3)).map((m) => m.short),
    sentiment: (["Positive", "Neutral", "Negative"] as const)[i % 3],
    leader: i % 2 === 0 ? "Competitor" : "You",
  }));
}
