/** Strategic landing content — how the workspace identifies & optimizes ChatGPT prompts. */

export const chatgptPromptsLanding = {
  path: "/chatgpt-prompts",
  title: "How CitePilot Tracks & Optimizes ChatGPT Money Prompts",
  shortTitle: "ChatGPT Money Prompts",
  description:
    "See how the CitePilot workspace discovers buyer prompts, baselines ChatGPT citations, prioritizes gaps, and ships weekly optimizations with proof.",
  dateModified: "2026-06-03",
} as const;

export type PromptIntent = {
  id: string;
  label: string;
  tag: string;
  description: string;
  examples: string[];
  optimizeWith: string[];
};

/** Programmatic intent taxonomy — each category maps to workspace prompt templates. */
export const promptIntentTaxonomy: PromptIntent[] = [
  {
    id: "buyer-fit",
    label: "Buyer-fit",
    tag: "Evaluate",
    description:
      "The question your ICP asks when forming a shortlist — usually category + segment + constraint.",
    examples: [
      "best CRM for agencies under 50 seats",
      "top project management tool for remote engineering teams",
    ],
    optimizeWith: [
      "Answer capsule on homepage or product page",
      "FAQ schema mirroring the exact question",
      "Segment-specific case study",
    ],
  },
  {
    id: "alternatives",
    label: "Alternatives",
    tag: "Displace",
    description:
      "Buyer already has an incumbent; ChatGPT returns a replacement set. Highest displacement ROI.",
    examples: [
      "alternatives to HubSpot for B2B SaaS",
      "Segment competitors for mid-market data teams",
    ],
    optimizeWith: [
      "/alternatives hub with honest tradeoffs",
      "G2 & Capterra reviews naming migration outcomes",
      "Third-party comparison articles",
    ],
  },
  {
    id: "comparison",
    label: "Head-to-head",
    tag: "Compare",
    description:
      "Direct vs prompts where ChatGPT names a winner. Track competitor citation share.",
    examples: [
      "Acme vs Competitor for enterprise SSO",
      "Notion vs Coda for product teams",
    ],
    optimizeWith: [
      "/vs/[competitor] page with feature matrix",
      "Quotable pricing & security rows",
      "Internal links from docs and blog",
    ],
  },
  {
    id: "pricing",
    label: "Pricing & packaging",
    tag: "Transact",
    description:
      "Bottom-funnel prompts about cost, tiers, and ROI — often cited from pricing pages and reviews.",
    examples: [
      "Acme pricing for startups",
      "how much does [product] cost per seat",
    ],
    optimizeWith: [
      "Public pricing page with schema offers",
      "Transparent tier comparison table",
      "ROI calculator or migration TCO snippet",
    ],
  },
  {
    id: "roi",
    label: "ROI & trust",
    tag: "Validate",
    description:
      "Skepticism prompts before demo or purchase — ChatGPT pulls proof and social evidence.",
    examples: [
      "is [brand] worth it for healthcare compliance teams",
      "does [product] actually reduce churn for SaaS",
    ],
    optimizeWith: [
      "Customer proof with named outcomes",
      "Security & compliance page (SOC-2, HIPAA)",
      "Review velocity on trusted directories",
    ],
  },
  {
    id: "implementation",
    label: "Implementation",
    tag: "Adopt",
    description:
      "How-to and integration prompts — technical buyers ask ChatGPT before involving sales.",
    examples: [
      "how to integrate [product] with Salesforce",
      "how to choose a CDP for Shopify Plus",
    ],
    optimizeWith: [
      "OpenAPI docs + integration guides",
      "Stack Overflow answers linking to official docs",
      "HowTo schema on setup articles",
    ],
  },
];

export type WorkspacePhase = {
  id: string;
  step: number;
  title: string;
  subtitle: string;
  body: string;
  workspaceFeatures: string[];
  outcome: string;
};

export const workspacePromptLoop: WorkspacePhase[] = [
  {
    id: "discover",
    step: 1,
    title: "Discover prompt candidates",
    subtitle: "From one buyer question to a programmatic set",
    body: "Every workspace starts with your domain, category, competitors, and a real buyer question — the prompt someone types into ChatGPT when they are ready to evaluate vendors. CitePilot expands that seed into a programmatic prompt set: alternatives, head-to-head, pricing, ROI, and implementation variants tuned to your market.",
    workspaceFeatures: [
      "Onboarding captures your top buyer question (Step 5)",
      "Auto-generated money prompt ideas from domain + competitor + business type",
      "Settings: paste or edit monitored prompts (one per line)",
      "Fleet: CSV import to bulk-load prompts across client workspaces",
      "Discussions radar surfaces real buyer threads to mine new prompts",
    ],
    outcome: "A prioritized prompt inventory aligned to revenue intent — not keyword fluff.",
  },
  {
    id: "baseline",
    step: 2,
    title: "Baseline ChatGPT citation state",
    subtitle: "Probe live answers — not simulated rank checks",
    body: "For each monitored prompt, CitePilot runs citation probes against ChatGPT (alongside Perplexity, Gemini, and other surfaces on your plan). You see whether your brand is recommended, mentioned, cited with a link, or absent — plus which competitors and URLs ChatGPT trusted instead.",
    workspaceFeatures: [
      "Free audit: up to 10 prompts in ~60 seconds",
      "Workspace rescans on manual or weekly Autopilot schedule",
      "Per-prompt citation reason when available",
      "Platform presence breakdown on the Analytics hub",
      "Citation score & history for trend lines",
    ],
    outcome: "A measurable baseline Share of Model on ChatGPT for your exact prompt set.",
  },
  {
    id: "prioritize",
    step: 3,
    title: "Prioritize citation gaps",
    subtitle: "Gap list → GEO audit → displacement map",
    body: "Not every missing citation deserves the same sprint. The workspace ranks gaps by prompt intent, competitor displacement, and technical blockers surfaced in the GEO audit — schema, FAQ coverage, crawl signals, and extractability.",
    workspaceFeatures: [
      "Executive Briefing: grade ring + citation % at a glance",
      "Gap list on Overview with copy-ready prompts",
      "GEO Audit: technical checklist tied to retrieval",
      "Competitor overlap on shared money prompts",
      "Alerts when citation score drops week over week",
    ],
    outcome: "A ranked backlog: which ChatGPT prompts to fix first for pipeline impact.",
  },
  {
    id: "optimize",
    step: 4,
    title: "Ship prompt-specific fixes",
    subtitle: "Content, schema, and authority — per prompt intent",
    body: "Optimization is prompt-native. A comparison gap gets a /vs page and table schema; an alternatives gap gets displacement copy and review velocity; an implementation gap gets docs and OpenAPI discoverability. Autopilot turns the highest-leverage gaps into weekly action items — not generic SEO tasks.",
    workspaceFeatures: [
      "Weekly Autopilot action plan from live gap analysis",
      "Content queue: articles targeting citation gaps",
      "CMS publish to Webflow, WordPress, Ghost, Shopify, Framer",
      "Backlinks & discussion outreach for off-site corpus",
      "Copilot grounded in your workspace citation context",
    ],
    outcome: "Shipped fixes mapped 1:1 to prompts that failed citation — not random blog posts.",
  },
  {
    id: "prove",
    step: 5,
    title: "Prove lift on the same prompts",
    subtitle: "Re-scan → delta → proof report",
    body: "Success is citation lift on the prompts you chose — measured weekly on the same inventory. Analytics shows per-prompt movement; proof reports package baseline → actions → lift for stakeholders. That closed loop is what separates GEO from one-off audits.",
    workspaceFeatures: [
      "Weekly re-scan with citation history charts",
      "Analytics: Google vs LLM source toggle per prompt set",
      "Shareable audit links for prospects & clients",
      "White-label proof PDF for agencies (Fleet)",
      "Email digests & score-drop alerts in Settings",
    ],
    outcome: "Documented ChatGPT citation lift tied to specific money prompts.",
  },
];

export const chatgptPromptsFaqs = [
  {
    q: "How does CitePilot pick which ChatGPT prompts to track?",
    a: "You provide a seed buyer question during onboarding; the workspace generates intent-based variants (alternatives, vs, pricing, ROI, implementation). You can edit monitored prompts in Settings or bulk-import via CSV on Fleet plans.",
  },
  {
    q: "Does CitePilot read my private ChatGPT conversations?",
    a: "No. CitePilot probes how ChatGPT answers your monitored prompts using the same class of live retrieval APIs used in production audits — it does not access user chat history.",
  },
  {
    q: "How is this different from tracking ChatGPT referral traffic in GA4?",
    a: "Referral traffic shows clicks after the fact. CitePilot measures whether ChatGPT cites or recommends you on specific buyer prompts before the click — so you can fix gaps proactively.",
  },
  {
    q: "How many ChatGPT prompts can I monitor?",
    a: "The free audit supports up to 10 prompts. Paid workspaces scale monitored prompts with Pilot and Fleet tiers; Fleet adds CSV import across client workspaces.",
  },
  {
    q: "How often are ChatGPT prompts re-scanned?",
    a: "Manual rescans anytime; Autopilot schedules weekly rescans on paid plans and stores history for trend charts and proof reports.",
  },
  {
    q: "What should I do when ChatGPT cites a competitor but not me?",
    a: "Check the cited URLs in your gap report, match prompt intent (comparison vs alternatives), ship the matching page type, strengthen third-party mentions, and re-scan the same prompt next week to verify lift.",
  },
] as const;
