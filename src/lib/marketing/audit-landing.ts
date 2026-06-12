/** Copy and data for the public /audit landing page. */

export const auditLanding = {
  path: "/audit",
  title: "Free AI Citation Audit in 60 Seconds",
  shortTitle: "Free AI Citation Audit",
  description:
    "Run a free 60-second AI citation audit. CitePilot diagnoses ChatGPT, Perplexity & Google AI Overviews, scores GEO readiness, and maps money-prompt citation gaps.",
} as const;

export type DiagnosticPhase = {
  id: string;
  seconds: string;
  title: string;
  body: string;
  outputs: string[];
};

export const auditDiagnosticPhases: DiagnosticPhase[] = [
  {
    id: "fetch",
    seconds: "0–12s",
    title: "Live site fetch & GEO parse",
    body: "We pull your homepage HTML in parallel with robots.txt and sitemap checks — the same retrieval layer AI engines use before ranking sources.",
    outputs: [
      "Title, meta description, H1 extractability",
      "Word count & on-page entity prominence",
      "robots crawlability + sitemap discovery",
    ],
  },
  {
    id: "schema",
    seconds: "12–22s",
    title: "Structured data & schema diagnostic",
    body: "JSON-LD blocks are parsed for Organization, FAQPage, and general schema coverage — common retrieval trust signals for ChatGPT and Perplexity footnotes.",
    outputs: [
      "hasJsonLd · hasFaqSchema · hasOrganizationSchema",
      "Open Graph tag detection",
      "GEO technical score (0–100)",
    ],
  },
  {
    id: "probes",
    seconds: "22–48s",
    title: "Live AI engine probes",
    body: "Your buyer questions run against live APIs where configured — OpenAI for ChatGPT, Perplexity API, Serper for Google AI Overviews — with concurrent probes capped for speed.",
    outputs: [
      "Per-prompt brand citation detection",
      "Live vs inferred mode per platform",
      "Competitor mention signals in answers",
    ],
  },
  {
    id: "platforms",
    seconds: "48–55s",
    title: "Platform presence map",
    body: "Eight AI surfaces are scored — ChatGPT, Perplexity, Google AI Overviews, Gemini, Copilot, Claude, Grok, and DeepSeek — with share estimates per prompt set.",
    outputs: [
      "Cited vs not cited per engine",
      "Platform share percentage",
      "Cross-engine citation gap patterns",
    ],
  },
  {
    id: "gaps",
    seconds: "55–60s",
    title: "Citation score & gap report",
    body: "Results compile into a citation score, prompt-by-prompt verdicts with reasons, and a prioritized fix list you can action in the workspace or GEO Playbook.",
    outputs: [
      "Citation score /100",
      "Prompt results with cited + reason",
      "Top gaps to fix + upgrade path",
    ],
  },
];

export type EngineDiagnostic = {
  name: string;
  mode: "live" | "inferred";
  provider?: string;
  checks: string;
};

export const auditEngineDiagnostics: EngineDiagnostic[] = [
  {
    name: "ChatGPT",
    mode: "live",
    provider: "OpenAI",
    checks: "Live answer probe for brand/domain mentions on each money prompt.",
  },
  {
    name: "Perplexity",
    mode: "live",
    provider: "Perplexity API",
    checks: "Retrieval-style answer scan for citations and brand inclusion.",
  },
  {
    name: "Google AI Overviews",
    mode: "live",
    provider: "Serper",
    checks: "AI overview and SERP context signals where API is configured.",
  },
  {
    name: "Gemini",
    mode: "inferred",
    checks: "GEO score + on-site alignment model when live key not configured.",
  },
  {
    name: "Copilot",
    mode: "inferred",
    checks: "Technical readiness and content overlap inference.",
  },
  {
    name: "Claude",
    mode: "inferred",
    checks: "Entity prominence and extractability signals.",
  },
  {
    name: "Grok",
    mode: "inferred",
    checks: "Platform presence estimate from corpus alignment.",
  },
  {
    name: "DeepSeek",
    mode: "inferred",
    checks: "Citation likelihood from GEO technical score blend.",
  },
];

export const auditLandingFaqs = [
  {
    q: "What does the 60-second citation audit check?",
    a: "It fetches your site, scores GEO technical readiness (schema, crawlability, extractability), runs your money prompts against live AI probes where configured, maps platform presence across eight engines, and returns a citation score with prioritized gaps.",
  },
  {
    q: "Which AI engines are tested live vs estimated?",
    a: "ChatGPT (OpenAI), Perplexity, and Google AI Overviews use live API probes when server keys are set. Gemini, Copilot, Claude, Grok, and DeepSeek use GEO-informed inference from your site signals and prompt alignment until live keys are added.",
  },
  {
    q: "How many money prompts can I audit for free?",
    a: "Up to 10 buyer questions per audit on the free tier — one per line, focused on comparisons, alternatives, and best-for queries your ICP asks ChatGPT.",
  },
  {
    q: "How is citation score calculated?",
    a: "A blend of GEO technical score (~45%) and the share of your prompts cited or aligned (~55%). Live engine probes update the cited ratio when OPENAI_API_KEY and related keys are configured.",
  },
  {
    q: "What should I do after the audit?",
    a: "Fix top gaps (schema, FAQ, answer capsules), create a CitePilot workspace for weekly rescans, or read the GEO Playbook for Perplexity and ChatGPT optimization frameworks.",
  },
  {
    q: "Does this audit guarantee I'll get cited?",
    a: "No. The audit measures current signals and likely citation alignment — it does not guarantee future AI citations. Use it to find gaps, ship fixes yourself, then re-scan to measure change.",
  },
] as const;
