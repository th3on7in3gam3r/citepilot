export type ComparisonCell = "yes" | "no" | "limited";

export type ComparisonRowKey =
  | "aiCitationTracking"
  | "moneyPromptMonitoring"
  | "weeklyActionPlans"
  | "proofReports"
  | "cmsPublishing"
  | "whiteLabelReports"
  | "pricing"
  | "geoAudits"
  | "llmPlatformCoverage";

export const COMPARISON_ROW_LABELS: Record<ComparisonRowKey, string> = {
  aiCitationTracking: "AI citation tracking",
  moneyPromptMonitoring: "Money prompt monitoring",
  weeklyActionPlans: "Weekly action plans",
  proofReports: "Proof reports",
  cmsPublishing: "CMS publishing",
  whiteLabelReports: "White-label reports",
  pricing: "Pricing",
  geoAudits: "GEO-specific audits",
  llmPlatformCoverage: "LLM platform coverage",
};

export const COMPARISON_ROW_ORDER: ComparisonRowKey[] = [
  "aiCitationTracking",
  "moneyPromptMonitoring",
  "weeklyActionPlans",
  "proofReports",
  "cmsPublishing",
  "whiteLabelReports",
  "pricing",
  "geoAudits",
  "llmPlatformCoverage",
];

export type Competitor = {
  slug: string;
  name: string;
  tagline: string;
  intro: string;
  strengths: string[];
  limitations: string[];
  pricingNote: string;
  whenChooseThem: string;
  whenChooseUs: string;
  useBothTogether: string;
  comparisonRows: Record<
    ComparisonRowKey,
    { citepilot: ComparisonCell | string; competitor: ComparisonCell | string }
  >;
  faqs: { q: string; a: string }[];
};

const CITEPILOT_DEFAULTS: Record<
  ComparisonRowKey,
  { citepilot: ComparisonCell | string; competitor: ComparisonCell | string }
> = {
  aiCitationTracking: { citepilot: "yes", competitor: "no" },
  moneyPromptMonitoring: { citepilot: "yes", competitor: "no" },
  weeklyActionPlans: { citepilot: "yes", competitor: "no" },
  proofReports: { citepilot: "yes", competitor: "limited" },
  cmsPublishing: { citepilot: "yes", competitor: "no" },
  whiteLabelReports: { citepilot: "yes", competitor: "limited" },
  pricing: { citepilot: "Free audit · Pilot from $79/mo", competitor: "—" },
  geoAudits: { citepilot: "yes", competitor: "limited" },
  llmPlatformCoverage: { citepilot: "8 AI engines", competitor: "limited" },
};

function rows(
  overrides: Partial<
    Record<
      ComparisonRowKey,
      { citepilot?: ComparisonCell | string; competitor: ComparisonCell | string }
    >
  >,
): Competitor["comparisonRows"] {
  const base = { ...CITEPILOT_DEFAULTS };
  for (const key of COMPARISON_ROW_ORDER) {
    if (overrides[key]) {
      base[key] = { ...base[key], ...overrides[key]! };
    }
  }
  return base;
}

export const competitors: Competitor[] = [
  {
    slug: "semrush",
    name: "Semrush",
    tagline: "The leading SEO platform for rank tracking",
    intro:
      "Semrush is one of the most complete traditional SEO suites — keyword research, backlink analytics, site audits, and competitive intelligence for Google rankings. It does not natively track whether ChatGPT, Perplexity, or Google AI Overviews cite your brand on buyer prompts. CitePilot fills that GEO gap with prompt-level citation monitoring and proof reports.",
    strengths: [
      "Backlink index depth",
      "Keyword research & gap analysis",
      "Full technical site audit",
    ],
    limitations: [
      "No AI citation tracking",
      "No LLM prompt monitoring",
      "No GEO action plans",
    ],
    pricingNote: "Starts at $129.95/mo for Pro",
    whenChooseThem:
      "Choose Semrush when your primary KPI is organic keyword rankings, PPC research, or enterprise SEO reporting across hundreds of tracked keywords — and AI citation share is not yet on the roadmap.",
    whenChooseUs:
      "Choose CitePilot when buyers ask AI for recommendations and you need to know if you're cited, who replaced you, and what to fix this week — with shareable proof for stakeholders.",
    useBothTogether:
      "Many teams keep Semrush for keyword and backlink research, then run CitePilot on the same money prompts to track AI citation lift after content and schema fixes ship.",
    comparisonRows: rows({
      proofReports: { competitor: "limited" },
      cmsPublishing: { competitor: "no" },
      whiteLabelReports: { competitor: "limited" },
      pricing: { competitor: "From $129.95/mo (Pro)" },
      geoAudits: { competitor: "limited" },
      llmPlatformCoverage: { competitor: "Add-on AI visibility scores" },
    }),
    faqs: [
      {
        q: "Is CitePilot a Semrush alternative for AI citations?",
        a: "Yes — for GEO and LLM citation monitoring, CitePilot is purpose-built where Semrush focuses on traditional SERP metrics. Many teams use both.",
      },
      {
        q: "Does Semrush track ChatGPT citations?",
        a: "Semrush offers AI visibility add-ons but does not provide prompt-level citation rate across buyer money prompts the way CitePilot does.",
      },
      {
        q: "Can I run a CitePilot audit without Semrush?",
        a: "Absolutely. The free citation audit requires no Semrush account — enter your domain and money prompts to see AI citation gaps in about 60 seconds.",
      },
      {
        q: "Which tool is better for agencies?",
        a: "Semrush for broad SEO retainers; CitePilot Fleet ($249/mo) for unlimited client workspaces, white-label audit links, and GEO proof clients actually ask about.",
      },
    ],
  },
  {
    slug: "ahrefs",
    name: "Ahrefs",
    tagline: "Industry-leading backlink and keyword intelligence",
    intro:
      "Ahrefs dominates backlink index depth, content explorer, and rank tracking for Google organic results. It answers \"who links to whom\" and \"which keywords rank\" — not \"does ChatGPT recommend us when buyers ask for alternatives.\" CitePilot tracks citation presence per money prompt across major LLMs and turns gaps into weekly GEO fixes.",
    strengths: [
      "Largest backlink index",
      "Content explorer & SERP analysis",
      "Rank tracking & site audit",
    ],
    limitations: [
      "No AI citation tracking",
      "No buyer prompt monitoring",
      "No GEO weekly action plans",
    ],
    pricingNote: "Starts at ~$99/mo (Lite)",
    whenChooseThem:
      "Choose Ahrefs when link building, content gap analysis against SERPs, and organic share-of-voice are your core deliverables.",
    whenChooseUs:
      "Choose CitePilot when commercial prompts in AI assistants drive pipeline and you need citation deltas, not just backlink counts.",
    useBothTogether:
      "Use Ahrefs to find content and link opportunities; use CitePilot to verify those pages earn AI citations on the prompts that close deals.",
    comparisonRows: rows({
      proofReports: { competitor: "limited" },
      pricing: { competitor: "From ~$99/mo (Lite)" },
      geoAudits: { competitor: "no" },
      llmPlatformCoverage: { competitor: "no" },
    }),
    faqs: [
      {
        q: "Is CitePilot an Ahrefs alternative?",
        a: "For AI citation monitoring and GEO proof — yes. For backlink index depth, Ahrefs remains the category leader; CitePilot complements it.",
      },
      {
        q: "Does Ahrefs offer GEO tracking?",
        a: "Ahrefs does not track LLM citation rate per buyer prompt. CitePilot was built specifically for generative engine optimization.",
      },
      {
        q: "Ahrefs vs CitePilot for startups?",
        a: "Start with CitePilot's free audit if AI visibility is the question. Add Ahrefs when you need large-scale link and keyword research.",
      },
      {
        q: "Can agencies use both?",
        a: "Yes — Fleet agencies often keep Ahrefs for research and CitePilot for client-facing citation proof and white-label reports.",
      },
    ],
  },
  {
    slug: "moz",
    name: "Moz",
    tagline: "Domain Authority and approachable SEO tooling",
    intro:
      "Moz popularized Domain Authority and offers accessible keyword tracking, local SEO, and educational content for traditional search. Moz does not measure whether AI assistants cite your brand on high-intent prompts. CitePilot provides a citation health score, GEO audits, and weekly monitoring built for the post-search era.",
    strengths: [
      "Domain Authority metrics",
      "Local SEO & listings",
      "Beginner-friendly SEO education",
    ],
    limitations: [
      "No LLM citation monitoring",
      "No money prompt tracking",
      "Limited AI search coverage",
    ],
    pricingNote: "Starts at ~$99/mo (Standard)",
    whenChooseThem:
      "Choose Moz when DA/PA benchmarking, local pack tracking, or SEO training for junior marketers is the priority.",
    whenChooseUs:
      "Choose CitePilot when leadership asks \"are we showing up in ChatGPT?\" and you need prompt-level proof, not authority scores alone.",
    useBothTogether:
      "Moz for local and link authority context; CitePilot for AI answer share on the commercial prompts that drive revenue.",
    comparisonRows: rows({
      proofReports: { competitor: "limited" },
      pricing: { competitor: "From ~$99/mo (Standard)" },
      geoAudits: { competitor: "limited" },
      llmPlatformCoverage: { competitor: "no" },
    }),
    faqs: [
      {
        q: "Does CitePilot have Domain Authority?",
        a: "CitePilot shows Open PageRank domain rating plus a GEO technical score — but optimizes for citation rate, not DA alone.",
      },
      {
        q: "Moz vs CitePilot for small businesses?",
        a: "Moz helps with Google local and on-page basics. CitePilot answers whether AI recommends you when prospects ask buying questions.",
      },
      {
        q: "Is Moz still relevant with AI search?",
        a: "For traditional SEO, yes. For AI citation share you need dedicated GEO tooling Moz doesn't provide.",
      },
      {
        q: "Can I try CitePilot before paying for Moz?",
        a: "Yes — run a free citation audit with no Moz account required.",
      },
    ],
  },
  {
    slug: "brightedge",
    name: "BrightEdge",
    tagline: "Enterprise SEO and content performance platform",
    intro:
      "BrightEdge serves enterprise marketing teams with rank tracking, content recommendations, and Share of Voice across organic search at scale. Enterprise dashboards rarely expose prompt-level AI citation data for ChatGPT or Perplexity. CitePilot delivers fast GEO baselines, weekly rescans, and proof reports agencies can white-label.",
    strengths: [
      "Enterprise-scale reporting",
      "Content performance insights",
      "Share of Voice analytics",
    ],
    limitations: [
      "No native AI citation tracking",
      "Heavy enterprise onboarding",
      "Limited LLM prompt monitoring",
    ],
    pricingNote: "Custom enterprise pricing",
    whenChooseThem:
      "Choose BrightEdge when you need enterprise SEO governance, large-site content analytics, and executive dashboards tied to organic Share of Voice.",
    whenChooseUs:
      "Choose CitePilot when GEO is a new service line and you need citation proof per client without a six-month enterprise rollout.",
    useBothTogether:
      "BrightEdge for enterprise organic reporting; CitePilot layered on top for AI citation monitoring and client-ready GEO proof.",
    comparisonRows: rows({
      proofReports: { competitor: "yes" },
      cmsPublishing: { competitor: "limited" },
      whiteLabelReports: { competitor: "yes" },
      pricing: { competitor: "Custom (enterprise)" },
      geoAudits: { competitor: "limited" },
      llmPlatformCoverage: { competitor: "limited" },
    }),
    faqs: [
      {
        q: "BrightEdge vs CitePilot for enterprises?",
        a: "BrightEdge scales traditional SEO reporting. CitePilot adds AI citation tracking and GEO audits without replacing your enterprise SEO stack.",
      },
      {
        q: "Does BrightEdge track AI Overviews?",
        a: "BrightEdge focuses on organic SERP features. CitePilot tracks citations across ChatGPT, Perplexity, Gemini, and other LLMs per prompt.",
      },
      {
        q: "Can agencies white-label with CitePilot?",
        a: "Fleet ($249/mo) includes white-label audit share links and proof PDFs — ideal for agencies pitching GEO alongside enterprise SEO tools.",
      },
      {
        q: "How fast can we get a GEO baseline?",
        a: "Under 60 seconds with CitePilot's free audit — no BrightEdge contract required.",
      },
    ],
  },
  {
    slug: "conductor",
    name: "Conductor",
    tagline: "Enterprise content and SEO orchestration",
    intro:
      "Conductor helps large marketing organizations plan, create, and measure content for organic search with workflow and governance built in. It excels at content operations — not at telling you whether AI assistants cite your brand on buyer prompts. CitePilot closes the GEO loop with citation audits, monitoring, and CMS publishing.",
    strengths: [
      "Content workflow & governance",
      "Enterprise SEO planning",
      "Cross-team collaboration",
    ],
    limitations: [
      "No AI citation monitoring",
      "No LLM-specific audits",
      "No GEO action plans",
    ],
    pricingNote: "Custom enterprise pricing",
    whenChooseThem:
      "Choose Conductor when content operations, editorial calendars, and enterprise SEO governance across global teams are the bottleneck.",
    whenChooseUs:
      "Choose CitePilot when you need to prove AI citation lift from that content — and ship fixes via CMS without another enterprise procurement cycle.",
    useBothTogether:
      "Conductor for content planning and approvals; CitePilot to measure whether published pages earn AI citations on money prompts.",
    comparisonRows: rows({
      proofReports: { competitor: "limited" },
      cmsPublishing: { competitor: "limited" },
      whiteLabelReports: { competitor: "limited" },
      pricing: { competitor: "Custom (enterprise)" },
      geoAudits: { competitor: "no" },
      llmPlatformCoverage: { competitor: "no" },
    }),
    faqs: [
      {
        q: "Conductor vs CitePilot — do I need both?",
        a: "If you already orchestrate content in Conductor, CitePilot adds the GEO measurement layer: citation rate, gaps, and weekly fixes.",
      },
      {
        q: "Does Conductor support GEO?",
        a: "Conductor is built for organic content operations. CitePilot is built for generative engine optimization and AI citation proof.",
      },
      {
        q: "Can CitePilot publish to our CMS?",
        a: "Pilot and Fleet connect to Webflow, WordPress, and other CMS providers so GEO content ships without copy-paste.",
      },
      {
        q: "What's the fastest way to evaluate CitePilot?",
        a: "Run a free citation audit — no Conductor integration required to see your baseline score.",
      },
    ],
  },
];

export function getCompetitor(slug: string): Competitor | undefined {
  return competitors.find((c) => c.slug === slug);
}

export function competitorPageTitle(name: string): string {
  return `CitePilot vs ${name}: AI Citation Tracking Compared`;
}

export function competitorMetaDescription(competitor: Competitor): string {
  return `${competitor.name} excels at ${competitor.strengths[0]?.toLowerCase() ?? "traditional SEO"}. CitePilot tracks AI citations on money prompts across ChatGPT, Perplexity, and Google AI — free audit available.`;
}

export function formatComparisonCell(value: ComparisonCell | string): string {
  if (value === "yes") return "✓";
  if (value === "no") return "✗";
  if (value === "limited") return "Limited";
  return value;
}

export function comparisonCellClass(value: ComparisonCell | string): string {
  if (value === "yes") return "text-emerald-400 font-semibold";
  if (value === "no") return "text-red-400/80";
  if (value === "limited") return "text-amber-400/90";
  return "text-white/70";
}
