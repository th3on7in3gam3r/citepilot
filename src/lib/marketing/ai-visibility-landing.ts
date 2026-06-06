/** Service landing — AI visibility metrics, AEO vs GEO, schema deployment. */

export const aiVisibilityLanding = {
  path: "/ai-visibility",
  title: "AI Visibility Service: Metrics, AEO vs GEO & Schema Automation",
  shortTitle: "AI Visibility Service",
  description:
    "Map citation score, Share of Model, and platform presence. Compare AEO vs GEO principles and deploy JSON-LD schema through CitePilot's automated audit-to-publish loop.",
  dateModified: "2026-06-03",
} as const;

export type VisibilityMetric = {
  id: string;
  name: string;
  acronym?: string;
  definition: string;
  whereTracked: string;
  whyItMatters: string;
};

export const aiVisibilityMetrics: VisibilityMetric[] = [
  {
    id: "citation-score",
    name: "Citation score",
    definition:
      "Composite index of how often your brand is cited or recommended across probed AI surfaces for your monitored prompt set.",
    whereTracked: "Executive Briefing · Overview · Audit results",
    whyItMatters:
      "Single health number for leadership — moves when fixes land, drops when competitors displace you.",
  },
  {
    id: "visibility-index",
    name: "Visibility index",
    acronym: "VI",
    definition:
      "Time-series citation strength stored on each re-scan — the slope matters more than a one-off snapshot.",
    whereTracked: "Analytics history charts · Citation snapshots",
    whyItMatters:
      "Proves trajectory for board reports and client retainers — baseline → action → lift.",
  },
  {
    id: "share-of-model",
    name: "Share of Model",
    acronym: "SoM",
    definition:
      "Percentage of money prompts where your brand is cited or recommended versus competitors on the same inventory.",
    whereTracked: "Analytics · Proof reports · Weekly rescans",
    whyItMatters:
      "The GEO replacement for Share of Voice — prompt-native, not keyword-native.",
  },
  {
    id: "platform-presence",
    name: "Platform presence",
    definition:
      "Per-engine citation rate across ChatGPT, Perplexity, Gemini, Google AI Overviews, Grok, DeepSeek, and more.",
    whereTracked: "Overview platform grid · Analytics LLM tab",
    whyItMatters:
      "Surfaces engine-specific gaps — strong on Perplexity but invisible in ChatGPT is a fixable pattern.",
  },
  {
    id: "geo-score",
    name: "GEO technical score",
    definition:
      "On-site readiness: JSON-LD, FAQ schema, Organization markup, crawlability, sitemap, and extractability signals.",
    whereTracked: "GEO Audit · siteSignals on each audit run",
    whyItMatters:
      "Retrieval blockers — if schema and crawl fail, content never reaches the citation layer.",
  },
  {
    id: "prompt-citation-rate",
    name: "Per-prompt citation rate",
    definition:
      "Binary and graded citation state for each monitored money prompt — cited, mentioned, recommended, or absent.",
    whereTracked: "Analytics prompt table · Gap list",
    whyItMatters:
      "Ties every optimization to a specific buyer question, not aggregate traffic.",
  },
];

export type AeoGeoPrinciple = {
  dimension: string;
  aeo: string;
  geo: string;
  citePilot: string;
};

export const aeoVsGeoPrinciples: AeoGeoPrinciple[] = [
  {
    dimension: "Primary goal",
    aeo: "Be selected as the direct answer in AI and answer engines.",
    geo: "Be retrieved, ranked, and cited inside generative synthesized responses.",
    citePilot: "Track both — recommendation in prose and footnote/link citation per prompt.",
  },
  {
    dimension: "Unit of measurement",
    aeo: "Answer inclusion rate on high-intent queries.",
    geo: "Share of Model across a defined money-prompt inventory.",
    citePilot: "Citation score + per-prompt states + weekly visibility index.",
  },
  {
    dimension: "Content format",
    aeo: "Concise answer capsules, FAQ blocks, speakable summaries.",
    geo: "Extractable H2s, comparison tables, schema-backed entities.",
    citePilot: "Content queue ships FAQPage/Article schema-ready articles to your CMS.",
  },
  {
    dimension: "Technical layer",
    aeo: "Structured Q&A, speakable schema, featured-snippet patterns.",
    geo: "JSON-LD graph, entity sameAs, OpenAPI/llms.txt, crawler access.",
    citePilot: "GEO Audit flags gaps; Autopilot prioritizes schema fixes before volume.",
  },
  {
    dimension: "Off-site signals",
    aeo: "Authority sources engines already trust for answers.",
    geo: "Third-party corpus consensus across reviews, forums, directories.",
    citePilot: "Backlinks + Discussions radar feed the authority loop.",
  },
  {
    dimension: "Optimization cadence",
    aeo: "Refresh answers when engines change retrieval behavior.",
    geo: "Weekly re-scan + displacement map when competitors gain SoM.",
    citePilot: "Autopilot weekly rescans, email digests, score-drop alerts.",
  },
];

export type SchemaDeploymentStep = {
  step: number;
  id: string;
  title: string;
  body: string;
  automations: string[];
};

export const schemaDeploymentPipeline: SchemaDeploymentStep[] = [
  {
    step: 1,
    id: "detect",
    title: "Detect schema gaps automatically",
    body: "Each citation audit fetches your live site and evaluates siteSignals — JSON-LD presence, FAQPage schema, Organization entity, Open Graph, robots crawlability, and sitemap discovery. Gaps surface in GEO Audit and the Executive Briefing grade ring.",
    automations: [
      "Live HTML fetch on every audit run",
      "hasJsonLd · hasFaqSchema · hasOrganizationSchema flags",
      "GEO score 0–100 with ranked fix list",
      "Correlation insights when schema gaps match citation misses",
    ],
  },
  {
    step: 2,
    id: "prioritize",
    title: "Prioritize fixes by citation impact",
    body: "Not all schema work is equal. CitePilot ranks Organization + FAQ gaps higher when prompt-level citation fails on comparison or buyer-fit intents — so engineering ships schema that moves SoM, not vanity markup.",
    automations: [
      "Autopilot weekly action plan from live gaps",
      "Copilot grounded in workspace citation context",
      "Alerts when citation score drops after a deploy",
    ],
  },
  {
    step: 3,
    id: "generate",
    title: "Generate schema-ready content",
    body: "The content engine produces articles and FAQ hubs with embedded schema types — Article, FAQPage, HowTo — matching your money prompts. Markdown exports include schema hints; briefs specify JSON-LD targets per piece.",
    automations: [
      "Editorial briefs with schemaTypes[] per article",
      "FAQ sections mirroring monitored prompts verbatim",
      "Comparison and alternatives templates for commercial intent",
    ],
  },
  {
    step: 4,
    id: "deploy",
    title: "Deploy via CMS publish loop",
    body: "Push schema-backed content to Webflow, WordPress, Ghost, Shopify, or Framer from the article queue — closing the loop from audit gap to live URL without manual copy-paste. Re-scan the same prompts to verify citation lift.",
    automations: [
      "One-click publish to connected CMS providers",
      "Publication log with live URL tracking",
      "Post-publish weekly re-scan on Pilot/Fleet",
      "Proof PDF for stakeholder citation lift",
    ],
  },
];

export const aiVisibilityFaqs = [
  {
    q: "What is the difference between AEO and GEO?",
    a: "AEO (Answer Engine Optimization) focuses on being the chosen answer in AI and answer surfaces. GEO (Generative Engine Optimization) focuses on retrieval, ranking, and citation inside generative responses. CitePilot measures both via per-prompt citation states and Share of Model.",
  },
  {
    q: "Which AI visibility metrics should I report to executives?",
    a: "Lead with citation score trend, Share of Model on money prompts, and platform presence delta week over week. Add GEO technical score when explaining why fixes are schema vs content vs authority.",
  },
  {
    q: "Does CitePilot automatically inject JSON-LD into my website theme?",
    a: "CitePilot detects missing schema on your domain, generates schema-ready content, and publishes through your CMS integration. For core site templates, GEO Audit provides prioritized fixes your team or agency implements — then rescans validate lift.",
  },
  {
    q: "What schema types does the automated pipeline support?",
    a: "Organization, WebSite, FAQPage, Article, HowTo, and SoftwareApplication/Product patterns — aligned to your audit gaps and money-prompt intents.",
  },
  {
    q: "How often are visibility metrics updated?",
    a: "Free audit is a snapshot. Pilot and Fleet run weekly rescans (or manual on demand), storing visibility index history for Analytics and proof reports.",
  },
  {
    q: "Can agencies white-label AI visibility reports?",
    a: "Fleet includes white-label proof PDFs and multi-workspace monitoring — map metrics per client domain with CSV prompt import.",
  },
] as const;
