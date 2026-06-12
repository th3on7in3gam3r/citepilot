export const pillars = [
  {
    id: "monitor",
    title: "Monitor money prompts",
    description:
      "Track the 10–50 questions buyers actually ask AI — not vanity keywords. See where you're cited, ignored, or losing to competitors across ChatGPT, Perplexity, Google AI Overviews, Grok, and more.",
    icon: "radar",
  },
  {
    id: "prioritize",
    title: "Prioritize what moves citations",
    description:
      "Every week, CitePilot ranks gaps by impact: schema fixes, answer capsules, listicles, third-party mentions, and on-site content — tied to the prompts that drive revenue.",
    icon: "compass",
  },
  {
    id: "prove",
    title: "Prove citation lift",
    description:
      "Ship a fix, re-scan in 7 days, and see citation rate change per prompt. Dashboards that stop at scores don't close the loop — CitePilot does.",
    icon: "chart",
  },
] as const;

export const differentiators = [
  {
    them: "Tracks “AI visibility” with opaque scores",
    us: "Tracks money prompts — the buyer questions that drive revenue",
  },
  {
    them: "Delivers a dashboard or PDF, then stops",
    us: "Ranks weekly fixes by citation impact and re-scans to prove lift",
  },
  {
    them: "Pushes content volume on autopilot",
    us: "Generates and publishes only what closes an audit gap — then measures again",
  },
  {
    them: "Monitors generic mentions or social noise",
    us: "Surfaces high-intent threads on Hacker News and Stack Overflow",
  },
] as const;

/** Sales deck + landing subcopy — import where needed */
export const positioning = {
  tagline: "Track citations in AI answers — then prove what moved.",
  oneLiner:
    "Most GEO tools report visibility. CitePilot closes the loop: audit gaps, ship fixes, publish content, measure citation lift per prompt.",
  audience:
    "Solo founders, small teams, and agencies who need prompt-level proof — not another AI SEO score.",
} as const;

export const competitorComparison = [
  {
    category: "AI visibility tools",
    examples: "Profound, Otterly, Peec",
    theyDo: "Monitor brand mentions across LLMs",
    citePilot: "Same monitoring — plus prioritized actions and publish-to-CMS execution",
  },
  {
    category: "SEO suites",
    examples: "Semrush, Ahrefs",
    theyDo: "Keywords, backlinks, rankings — AI add-ons",
    citePilot: "Citation rate per money prompt, not keyword position alone",
  },
  {
    category: "AI content writers",
    examples: "Jasper, Writesonic",
    theyDo: "Volume content generation",
    citePilot: "Fewer pieces tied to measured gaps — then re-audit",
  },
] as const;

export const platforms = [
  "ChatGPT",
  "Perplexity",
  "Google AI Overviews",
  "Gemini",
  "Claude",
  "Copilot",
  "Grok",
  "DeepSeek",
] as const;

export const faq = [
  {
    q: "How is CitePilot different from traditional SEO tools?",
    a: "SEO tools optimize for blue links. CitePilot optimizes for being named inside AI-generated answers — and shows you citation rate per prompt, not just keyword position.",
  },
  {
    q: "What is a \"money prompt\"?",
    a: "A real buyer question like \"best CRM for agencies under 50 seats\" or \"alternatives to [competitor].\" You choose them; we track whether AI answers cite you.",
  },
  {
    q: "Do I need a huge content volume?",
    a: "No. Most teams win by fixing structure, earning mentions on trusted sources, and publishing fewer pieces that directly target citation gaps.",
  },
  {
    q: "Is the free audit really free?",
    a: "Yes. Run a citation snapshot on your domain with no credit card. Paid plans add ongoing monitoring, weekly plans, and publishing integrations.",
  },
  {
    q: "How does ongoing monitoring work?",
    a: "Pilot and Fleet re-scan your monitored prompts on a weekly schedule, store citation history for trend charts, and email digests or score-drop alerts when configured in Settings.",
  },
] as const;

export const pricingTiers = [
  {
    name: "Audit",
    price: "Free",
    period: "",
    description: "One-time citation snapshot for your domain.",
    features: [
      "Up to 10 money prompts",
      "8 AI platform scan",
      "Gap summary & competitor mentions",
      "Shareable report link",
    ],
    cta: "Run free audit",
    href: "/audit",
    highlighted: false,
  },
  {
    name: "Pilot",
    price: "$79",
    period: "/mo",
    description: "For founders and small teams shipping weekly.",
    features: [
      "25 monitored prompts",
      "Weekly prioritized action plan",
      "Citation delta tracking",
      "Email alerts on competitor moves",
      "CitePilot Insights (prioritize fixes & explain gaps)",
      "CMS publish (Webflow, WordPress, Ghost, Shopify, Framer)",
    ],
    cta: "Subscribe to Pilot",
    href: "/audit",
    highlighted: true,
  },
  {
    name: "Fleet",
    price: "$249",
    period: "/mo",
    description: "For agencies managing multiple brands.",
    features: [
      "Unlimited client workspaces",
      "White-label audit reports",
      "JSON export + API keys",
      "CSV bulk prompt import",
      "Priority support",
    ],
    cta: "Subscribe to Fleet",
    href: "/pricing",
    highlighted: false,
  },
] as const;
