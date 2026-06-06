/** Exhaustive GEO guide content — frameworks, modules, checklists, rollout plan. */

export type GeoFramework = {
  id: string;
  acronym: string;
  name: string;
  tagline: string;
  pillars: { label: string; body: string }[];
  applyWhen: string;
};

export type GeoModuleTopic = {
  label: string;
  body: string;
  bullets?: string[];
  example?: string;
};

export type GeoModule = {
  id: string;
  number: number;
  title: string;
  summary: string;
  topics: GeoModuleTopic[];
};

export type GeoChecklistItem = {
  id: string;
  label: string;
  detail: string;
  category: string;
};

export type GeoSevenDayTask = {
  day: number;
  title: string;
  outcome: string;
  tasks: string[];
};

export const geoEngines = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    retrieval: "Bing + partner index + browsing",
    citationStyle: "Inline links + brand mentions in prose",
    priority: "Commercial comparison prompts",
  },
  {
    id: "perplexity",
    name: "Perplexity",
    retrieval: "Live web crawl + domain authority weighting",
    citationStyle: "Numbered footnotes with source cards",
    priority: "Research & vendor evaluation",
  },
  {
    id: "gemini",
    name: "Gemini / AI Overviews",
    retrieval: "Google index + Knowledge Graph",
    citationStyle: "Expandable source chips",
    priority: "Informational + local intent",
  },
  {
    id: "claude",
    name: "Claude",
    retrieval: "Training cutoff + optional web tools",
    citationStyle: "Attributed quotes when browsing enabled",
    priority: "Technical depth & policy-sensitive B2B",
  },
] as const;

export const geoFrameworks: GeoFramework[] = [
  {
    id: "geo-rag-stack",
    acronym: "RAG",
    name: "RAG Citation Stack",
    tagline: "Map how answers are built so you can intervene at each layer.",
    pillars: [
      {
        label: "Retrieve",
        body: "The engine decomposes the prompt, runs vector + keyword retrieval, and pulls candidate URLs, docs, and structured entities.",
      },
      {
        label: "Rank",
        body: "Sources are scored on freshness, domain trust, semantic match, and cross-corpus consensus — not classic PageRank alone.",
      },
      {
        label: "Synthesize",
        body: "The model compresses overlapping evidence into a single narrative, often preferring concise, attributed claims.",
      },
      {
        label: "Cite",
        body: "Only sources that survived ranking appear as links or brand mentions. If you are not retrieved, you cannot be cited.",
      },
    ],
    applyWhen:
      "Use this stack to diagnose drop-offs: invisible in retrieval vs. retrieved but not cited vs. cited but not recommended.",
  },
  {
    id: "geo-ace",
    acronym: "ACE",
    name: "Authority · Clarity · Extractability",
    tagline: "The on-page triangle every LLM-friendly page must satisfy.",
    pillars: [
      {
        label: "Authority",
        body: "Demonstrate expertise with named authors, customer proof, third-party reviews, and consistent entity signals across the web.",
      },
      {
        label: "Clarity",
        body: "Lead with definitional sentences, comparison tables, and unambiguous product boundaries models can quote without hallucinating.",
      },
      {
        label: "Extractability",
        body: "Structure content as answer capsules — 40–80 word blocks with H2/H3 anchors, lists, and schema that map 1:1 to prompt intents.",
      },
    ],
    applyWhen:
      "Run ACE as a page-level scorecard before publishing money-prompt landing pages or comparison hubs.",
  },
  {
    id: "geo-cite",
    acronym: "CITE",
    name: "Citations · Intent · Trust · Evidence",
    tagline: "Off-site and on-site signals that increase inclusion in synthesized answers.",
    pillars: [
      {
        label: "Citations",
        body: "Earn mentions on G2, Capterra, Hacker News, Stack Overflow, industry reports, and niche directories engines already trust.",
      },
      {
        label: "Intent",
        body: "Align copy to bottom-funnel prompts — alternatives, best-for, vs., pricing, integrations — not top-of-funnel glossaries only.",
      },
      {
        label: "Trust",
        body: "Ship Organization, Product, FAQ, and Review schema; keep NAP/entity data consistent across docs, support, and marketing sites.",
      },
      {
        label: "Evidence",
        body: "Publish benchmarks, migration guides, and API docs with quotable stats models can attribute ('According to [Brand]…').",
      },
    ],
    applyWhen:
      "Use CITE when planning quarterly off-site PR, review generation, and technical schema sprints.",
  },
  {
    id: "geo-som",
    acronym: "SoM",
    name: "Share of Model",
    tagline: "Replace Share of Voice with citation frequency across your money-prompt set.",
    pillars: [
      {
        label: "Define the prompt set",
        body: "50–200 high-intent prompts your ICP actually asks — comparisons, alternatives, best-for, pricing, security, integrations.",
      },
      {
        label: "Baseline citation rate",
        body: "Weekly rescans across ChatGPT, Perplexity, Gemini, and Claude; log brand mention, link, and recommendation position.",
      },
      {
        label: "Competitive displacement",
        body: "Track prompts where competitors are sole recommendees — these are your highest-ROI remediation targets.",
      },
      {
        label: "Prove lift",
        body: "Tie citation gains to pipeline: branded AI referral traffic, demo requests from AI-discovered pages, and sales-call mentions.",
      },
    ],
    applyWhen:
      "Report SoM to leadership monthly; it is the GEO equivalent of rank tracking.",
  },
  {
    id: "geo-dual-track",
    acronym: "SEO+GEO",
    name: "Dual-Track Optimization",
    tagline: "Google rankings and AI citations share crawlability but diverge on extractability.",
    pillars: [
      {
        label: "Shared foundation",
        body: "Crawlability, canonical hygiene, internal links, Core Web Vitals, and entity-rich schema benefit both channels.",
      },
      {
        label: "SEO emphasis",
        body: "Keywords, backlinks, SERP features, and click-through — still critical for mid-funnel discovery.",
      },
      {
        label: "GEO emphasis",
        body: "Answer capsules, comparison tables, FAQ depth, third-party corroboration, and prompt-aligned page variants.",
      },
      {
        label: "Measurement split",
        body: "Track rankings and SoM on the same prompt list to spot citation gaps where you rank but AI omits you.",
      },
    ],
    applyWhen:
      "When SEO reports look healthy but pipeline from AI-native buyers is flat — classic citation gap pattern.",
  },
];

export const geoPlaybookCurriculum: GeoModule[] = [
  {
    id: "geo-module-1",
    number: 1,
    title: "The RAG Era: How LLMs Choose What to Cite",
    summary:
      "Understand retrieval-augmented generation end-to-end so you can fix invisibility at the retrieve, rank, or cite stage.",
    topics: [
      {
        label: "The paradigm shift",
        body: "High-intent buyers increasingly skip SERPs. They ask conversational engines for shortlists, tradeoffs, and implementation advice. CTR on traditional blue links is collapsing for commercial queries while AI-mediated discovery grows.",
        bullets: [
          "RAG systems ground answers in live or indexed corpora — your site is competing with docs, forums, and review sites.",
          "Being ranked #1 on Google does not guarantee retrieval in step one of RAG.",
          "GEO optimizes for inclusion in synthesized answers, not just impressions.",
        ],
      },
      {
        label: "Citation mechanics",
        body: "Models prefer sources that are recent, authoritative, structurally clear, and corroborated across the web. They extract short, attributable claims rather than long marketing fluff.",
        example:
          "Prompt: 'Best SOC-2 automation for Series B SaaS' — engines pull G2 comparisons, security blogs, and vendor docs, then recommend 2–4 brands with explicit reasons.",
        bullets: [
          "Inline citations favor pages with clear H2 question headers and FAQ schema.",
          "Third-party reviews outweigh self-serving landing pages when trust scores tie.",
          "Conflicting entity data (old pricing, renamed products) reduces retrieval confidence.",
        ],
      },
      {
        label: "The cost of invisibility",
        body: "When an LLM summarizes your category without naming you, competitors capture 100% of that micro-moment — often before the buyer ever visits a comparison site.",
        bullets: [
          "74%+ of Page-1 Google brands can be omitted from AI recommendations on the same intent.",
          "Invisible brands still pay for brand search and retargeting while losing consideration-set inclusion.",
          "Citation gaps compound: models reinforce whichever sources appear most often in training and retrieval corpora.",
        ],
      },
    ],
  },
  {
    id: "geo-module-2",
    number: 2,
    title: "Mapping Money Prompts & Intent",
    summary:
      "Build the prompt inventory that drives pipeline — comparisons, alternatives, best-for, and integration queries your buyers actually type into AI.",
    topics: [
      {
        label: "Defining money prompts",
        body: "Money prompts are high-intent conversational queries at the bottom of the funnel. They mention use cases, constraints, competitors, or buying criteria — not awareness fluff.",
        example:
          "'What are the best enterprise alternatives to Segment for real-time data orchestration under $50k ARR?'",
        bullets: [
          "Source prompts from sales calls, Gong snippets, support tickets, and Reddit/Slack communities.",
          "Tag each prompt: informational, comparative, transactional, or implementation.",
          "Prioritize prompts where ACV × win rate × citation gap is highest.",
        ],
      },
      {
        label: "The intent matrix",
        body: "Classify prompts on two axes: buyer stage (evaluate vs. purchase) and engine behavior (browse-heavy vs. knowledge-graph-heavy).",
        bullets: [
          "Comparative: 'X vs Y for [use case]' — needs comparison tables and third-party validation.",
          "Alternative: 'alternatives to [incumbent]' — needs displacement pages and migration proof.",
          "Best-for: 'best [category] for [segment]' — needs segment-specific answer capsules.",
          "Transactional: 'pricing', 'SOC-2', 'SSO' — needs trust signals and structured product data.",
        ],
      },
      {
        label: "Competitor siphoning map",
        body: "For each money prompt, log who gets recommended, which URLs are cited, and whether your brand is mentioned, linked, or absent.",
        bullets: [
          "Build a displacement map: prompt → incumbent winner → cited URLs → your gap action.",
          "Rescan weekly — citation leaders change as engines refresh indexes.",
          "Focus remediation on prompts where you are retrieved but not recommended (fix extractability).",
        ],
      },
    ],
  },
  {
    id: "geo-module-3",
    number: 3,
    title: "Technical GEO Audit",
    summary:
      "Run the crawlability, schema, and entity checklist that determines whether RAG systems can retrieve and trust your domain.",
    topics: [
      {
        label: "Crawlability & index hygiene",
        body: "LLM crawlers and search APIs must reach your money pages without robots blocks, orphan URLs, or conflicting canonicals.",
        bullets: [
          "Unblock AI crawlers where policy allows (GPTBot, PerplexityBot, ClaudeBot, Google-Extended).",
          "Ensure comparison and pricing pages are ≤3 clicks from homepage with descriptive internal anchors.",
          "Fix soft-404s, redirect chains, and duplicate product entities across subdomains.",
        ],
      },
      {
        label: "Structured data & semantic markup",
        body: "Schema is the API between your HTML and machine readers — Organization, Product, SoftwareApplication, FAQPage, and HowTo are GEO-critical.",
        bullets: [
          "Validate JSON-LD in Search Console and schema.org validator — no silent parse errors.",
          "Match schema names to how buyers phrase your category (not internal codenames).",
          "Pair FAQ schema with visible FAQ copy that mirrors money prompts verbatim.",
        ],
      },
      {
        label: "Entity consistency",
        body: "Models resolve brands as entities. Mismatched logos, founding dates, product names, or support URLs reduce trust scores.",
        bullets: [
          "Maintain a single source of truth for brand name, URL, and product line in docs + marketing.",
          "Use sameAs links to LinkedIn, Crunchbase, G2, and GitHub in Organization schema.",
          "Publish a /about or /company page with quotable positioning engineers can cite.",
        ],
      },
    ],
  },
  {
    id: "geo-module-4",
    number: 4,
    title: "Answer Engineering & Extractability",
    summary:
      "Format pages so models can lift 40–80 word answer capsules without distortion — the core craft of modern GEO content.",
    topics: [
      {
        label: "Answer capsules",
        body: "Each H2 should answer one prompt in the first paragraph — definitional, comparative, or procedural — before supporting detail.",
        example:
          "H2: 'Is [Product] SOC-2 Type II certified?' → First sentence: Yes/No + scope + audit date. Then evidence links.",
        bullets: [
          "Target 40–80 words for the lead paragraph per H2 — model-quotable length.",
          "Use bold entity names and numerals models can extract reliably.",
          "Avoid burying the answer below fold or inside accordions crawlers may skip.",
        ],
      },
      {
        label: "Comparison & alternative pages",
        body: "Commercial money prompts demand tables: feature matrix, pricing tier, ideal customer profile, and honest tradeoffs.",
        bullets: [
          "Publish /vs/[competitor] and /alternatives pages with structured tables, not prose-only.",
          "Include 'When to choose us' and 'When to choose them' — balanced copy ranks as more trustworthy.",
          "Update quarterly; stale comparisons get dropped from retrieval.",
        ],
      },
      {
        label: "N-gram & embedding alignment",
        body: "Phrase unique value props using the same vocabulary buyers and reviewers use — not only internal positioning language.",
        bullets: [
          "Mirror prompt language in H1/H2 ('best CDP for Shopify Plus', not 'unified customer data layer').",
          "Repeat core differentiators consistently across docs, blog, and landing pages.",
          "Add glossary entries for category terms you want to own in embeddings.",
        ],
      },
    ],
  },
  {
    id: "geo-module-5",
    number: 5,
    title: "The Third-Party Authority Loop",
    summary:
      "Engineer the off-site corpus — reviews, forums, directories, and press — that RAG systems treat as ground truth.",
    topics: [
      {
        label: "Trusted corpus mapping",
        body: "Each engine weights sources differently. Map where your category's answers are assembled: G2, Capterra, Reddit, HN, SO, analyst reports, GitHub.",
        bullets: [
          "Audit top 10 cited domains for your top 20 money prompts.",
          "Identify gaps: missing G2 profile, stale Capterra, zero SO answers for integration questions.",
          "Prioritize platforms that appear in Perplexity footnotes for your prompts.",
        ],
      },
      {
        label: "Review & social proof velocity",
        body: "Fresh, detailed reviews with use-case specificity outperform star-count alone.",
        bullets: [
          "Prompt customers for reviews that mention integration, segment, and outcome — mirrors buyer prompts.",
          "Respond publicly to reviews; activity signals freshness.",
          "Syndicate case studies to publications engines already cite in your space.",
        ],
      },
      {
        label: "Community & developer presence",
        body: "HN, SO, and niche Slack/Discord threads become retrieval sources for technical and implementation prompts.",
        bullets: [
          "Answer integration questions on SO with links to official docs (not spam).",
          "Share benchmark posts and migration guides where practitioners discuss tools.",
          "Maintain updated API changelog — dev docs are heavily retrieved for B2B SaaS.",
        ],
      },
    ],
  },
  {
    id: "geo-module-6",
    number: 6,
    title: "SoM Measurement & Proof Reporting",
    summary:
      "Operationalize Share of Model — weekly rescans, citation lift proof, and board-ready reporting.",
    topics: [
      {
        label: "Share of Model (SoM)",
        body: "SoM = (prompts where your brand is cited or recommended) ÷ (total money prompts tracked) × 100, segmented by engine and competitor.",
        bullets: [
          "Track four states: recommended, mentioned, cited-only, absent.",
          "Weight prompts by pipeline influence — not all prompts are equal.",
          "Report SoM trend, not snapshot — executives fund trajectories.",
        ],
      },
      {
        label: "GEO pipeline attribution",
        body: "Connect citation gains to revenue proxies: AI referral traffic, demo form source, sales-call 'how did you hear about us' tags.",
        bullets: [
          "UTM AI referrals where identifiable; supplement with branded search lift on prompt themes.",
          "Log prompt themes in CRM when ops teams hear 'ChatGPT recommended you'.",
          "Run pre/post experiments on remediated prompt clusters.",
        ],
      },
      {
        label: "Client-ready proof reports",
        body: "Package baseline → actions shipped → citation lift → pipeline indicators in a one-page executive view.",
        bullets: [
          "Show competitor SoM side-by-side for the same prompt set.",
          "Screenshot citation snippets with date stamps for authenticity.",
          "Tie next sprint to top 5 displacement opportunities.",
        ],
      },
    ],
  },
];

export const geoImplementationChecklist: GeoChecklistItem[] = [
  {
    id: "chk-prompt-inventory",
    category: "Strategy",
    label: "Money prompt inventory (50+ prompts)",
    detail: "Document comparative, alternative, best-for, and transactional prompts from sales and support.",
  },
  {
    id: "chk-baseline-som",
    category: "Strategy",
    label: "Baseline Share of Model scan",
    detail: "Run citation audit across ChatGPT, Perplexity, Gemini, and Claude for your prompt set.",
  },
  {
    id: "chk-competitor-map",
    category: "Strategy",
    label: "Competitor displacement map",
    detail: "For each prompt, log winner, cited URLs, and your remediation owner.",
  },
  {
    id: "chk-crawler-access",
    category: "Technical",
    label: "AI crawler access verified",
    detail: "Review robots.txt for GPTBot, PerplexityBot, ClaudeBot, Google-Extended as policy allows.",
  },
  {
    id: "chk-schema-org",
    category: "Technical",
    label: "Organization + Product schema live",
    detail: "Validate JSON-LD with zero errors; sameAs links to G2, LinkedIn, Crunchbase.",
  },
  {
    id: "chk-faq-schema",
    category: "Technical",
    label: "FAQPage schema on money pages",
    detail: "FAQ questions mirror verbatim money prompts; answers are 2–4 sentences.",
  },
  {
    id: "chk-canonicals",
    category: "Technical",
    label: "Canonical & index hygiene",
    detail: "No orphan comparison pages; ≤3-click depth from homepage.",
  },
  {
    id: "chk-answer-capsules",
    category: "Content",
    label: "Answer capsules on top 10 URLs",
    detail: "Each H2 leads with a 40–80 word quotable paragraph.",
  },
  {
    id: "chk-comparison-pages",
    category: "Content",
    label: "/vs and /alternatives pages published",
    detail: "Feature tables, ICP fit, honest tradeoffs, last-updated date.",
  },
  {
    id: "chk-g2-capterra",
    category: "Off-site",
    label: "G2 + Capterra profiles complete",
    detail: "Fresh reviews mentioning use cases that match money prompts.",
  },
  {
    id: "chk-so-hn",
    category: "Off-site",
    label: "SO / HN presence for integration prompts",
    detail: "Official answers linking to docs for top integration questions.",
  },
  {
    id: "chk-weekly-rescan",
    category: "Measurement",
    label: "Weekly re-scan workflow",
    detail: "Automated prompt rescans with SoM delta and alert on competitor displacement.",
  },
  {
    id: "chk-proof-report",
    category: "Measurement",
    label: "Executive proof report template",
    detail: "Baseline, actions, citation lift, pipeline proxies — one page for stakeholders.",
  },
];

export const geoSevenDayPlan: GeoSevenDayTask[] = [
  {
    day: 1,
    title: "Baseline & prompt inventory",
    outcome: "You know where you are invisible and which prompts matter most.",
    tasks: [
      "Export 50+ money prompts from sales calls, support, and community research.",
      "Run a citation audit on your domain + top competitor.",
      "Tag each prompt: comparative / alternative / best-for / transactional.",
    ],
  },
  {
    day: 2,
    title: "Technical crawl & schema audit",
    outcome: "Retrieval blockers are documented with owners.",
    tasks: [
      "Audit robots.txt and AI crawler policy.",
      "Validate Organization, Product, and FAQ schema on money pages.",
      "Fix canonical conflicts and orphan comparison URLs.",
    ],
  },
  {
    day: 3,
    title: "Answer capsule sprint",
    outcome: "Top landing pages are model-quotable.",
    tasks: [
      "Rewrite H2 openings on top 5 URLs as 40–80 word answer capsules.",
      "Add comparison tables to /vs pages.",
      "Mirror top 10 prompts as FAQ entries with schema.",
    ],
  },
  {
    day: 4,
    title: "Third-party authority loop",
    outcome: "Off-site gaps have a 30-day execution plan.",
    tasks: [
      "List top 10 domains cited for your prompts in Perplexity.",
      "Refresh G2/Capterra; request 5 segment-specific reviews.",
      "Answer 3 Stack Overflow or community threads with doc links.",
    ],
  },
  {
    day: 5,
    title: "Competitor displacement",
    outcome: "Top 10 displacement prompts have dedicated pages.",
    tasks: [
      "Publish or update alternatives page for #1 cited competitor.",
      "Ship 'vs' page with feature matrix and migration proof.",
      "Internal-link from blog and docs to new comparison hubs.",
    ],
  },
  {
    day: 6,
    title: "Measurement setup",
    outcome: "SoM tracking runs on a weekly cadence.",
    tasks: [
      "Configure weekly re-scan for full prompt set.",
      "Define SoM formula and competitor benchmarks.",
      "Set CRM tag for 'AI referral' on demo requests.",
    ],
  },
  {
    day: 7,
    title: "Proof report & next sprint",
    outcome: "Leadership sees baseline and 30-day roadmap.",
    tasks: [
      "Build one-page proof report: baseline SoM, gaps, actions shipped.",
      "Prioritize next sprint: top 5 prompts by ACV × citation gap.",
      "Schedule monthly SoM review with sales and content stakeholders.",
    ],
  },
];

export type PerplexityPlaybookStep = {
  id: string;
  step: number;
  title: string;
  subtitle: string;
  body: string;
  actions: string[];
  technical?: { label: string; detail: string }[];
};

/** Step-by-step playbook: how Perplexity extracts citations. */
export const perplexityCitationPlaybook = {
  id: "geo-perplexity",
  title: "How Perplexity Extracts Citations",
  tagline:
    "An authoritative, step-by-step playbook for structured data, API schemas, and entity optimization.",
  intro:
    "Perplexity is a retrieval-first answer engine. It decomposes your prompt, runs live web search, ranks sources by relevance and domain trust, synthesizes an answer, and attaches numbered footnotes to the URLs that survived ranking. GEO for Perplexity means engineering your domain and entity graph so you are retrieved, trusted, and quoted — not just indexed.",
  pipeline: [
    "Query decomposition — intent, entities, and sub-questions",
    "Live retrieval — web crawl + index APIs (not training data alone)",
    "Source ranking — freshness, authority, semantic match, consensus",
    "Answer synthesis — compress evidence into prose with inline claims",
    "Citation surfacing — footnote cards link to the exact URLs used",
  ],
  steps: [
    {
      id: "perplexity-step-1",
      step: 1,
      title: "Map the Perplexity citation pipeline",
      subtitle: "Know where your brand drops off",
      body: "Before optimizing, trace the five stages above for your top money prompts. Run 10–20 comparative queries in Perplexity and record which domains appear in footnotes, in what order, and whether your brand is named in the prose. Gaps fall into three buckets: not retrieved (crawl/schema), retrieved but not ranked (authority/extractability), ranked but not named (answer capsule weakness).",
      actions: [
        "Export your top 20 B2B money prompts (vs, alternatives, best-for).",
        "Screenshot Perplexity answers + footnote domains per prompt.",
        "Classify each gap: retrieval, ranking, or synthesis.",
      ],
    },
    {
      id: "perplexity-step-2",
      step: 2,
      title: "Open the crawl path for PerplexityBot",
      subtitle: "Retrieval starts with access",
      body: "Perplexity's retrieval layer must fetch your HTML. Blocked crawlers, orphan URLs, and slow TTFB remove you before ranking begins. Allow PerplexityBot where policy permits, ensure money pages are internally linked, and eliminate redirect chains that waste crawl budget.",
      actions: [
        "Audit robots.txt for PerplexityBot / Perplexity-User rules.",
        "Confirm comparison, pricing, and docs URLs return 200 with canonical self-reference.",
        "Target LCP < 2.5s on top citation candidate pages.",
      ],
      technical: [
        {
          label: "robots.txt",
          detail:
            "User-agent: PerplexityBot — Allow: / for public marketing and docs unless legal requires blocks.",
        },
        {
          label: "Crawl depth",
          detail:
            "Money prompts should resolve to pages ≤3 clicks from homepage with descriptive anchor text.",
        },
      ],
    },
    {
      id: "perplexity-step-3",
      step: 3,
      title: "Ship structured data Perplexity can parse",
      subtitle: "JSON-LD is your machine-readable API",
      body: "Perplexity's ranker uses page structure and schema to understand entities, products, and FAQs. JSON-LD gives deterministic fields — name, description, offers, FAQ pairs — that HTML alone obscures. Invalid or conflicting schema reduces trust scores at ranking time.",
      actions: [
        "Deploy Organization + WebSite schema site-wide with logo and sameAs.",
        "Add SoftwareApplication or Product schema on product pages with feature lists.",
        "Mirror money-prompt FAQs in FAQPage schema with verbatim question text.",
        "Validate with Google Rich Results Test and schema.org validator — zero errors.",
      ],
      technical: [
        {
          label: "Organization",
          detail:
            '@type Organization — name, url, logo, sameAs [LinkedIn, Crunchbase, G2], contactPoint.',
        },
        {
          label: "SoftwareApplication",
          detail:
            "applicationCategory, operatingSystem (Web), offers, aggregateRating when eligible.",
        },
        {
          label: "FAQPage",
          detail:
            "mainEntity array of Question/Answer pairs matching visible on-page FAQ copy.",
        },
        {
          label: "Article / HowTo",
          detail:
            "Use on guides and implementation content; include dateModified for freshness signals.",
        },
      ],
    },
    {
      id: "perplexity-step-4",
      step: 4,
      title: "Publish API schemas & machine-readable feeds",
      subtitle: "Beyond HTML — give engines a structured corpus",
      body: "Technical buyers trigger Perplexity prompts about integrations, APIs, and data models. OpenAPI documents, public JSON feeds, and llms.txt files give retrieval systems dense, structured evidence that marketing pages lack. When your API schema is citable, you win implementation-intent prompts competitors miss.",
      actions: [
        "Host OpenAPI 3.x at a stable /openapi.json or /api/docs URL.",
        "Publish llms.txt at site root listing canonical docs, pricing, comparisons, and changelog.",
        "Expose product changelog and status page as RSS or JSON for freshness.",
        "Link OpenAPI and llms.txt from footer and docs index — discoverable in one hop.",
      ],
      technical: [
        {
          label: "OpenAPI",
          detail:
            "Document auth, rate limits, webhooks, and integration endpoints — models cite precise capability lists.",
        },
        {
          label: "llms.txt",
          detail:
            "Plain-text index of priority URLs with one-line descriptions; emerging standard for LLM crawlers.",
        },
        {
          label: "JSON-LD @id",
          detail:
            "Use stable @id URIs for Product and API entities so graph nodes dedupe across pages.",
        },
      ],
    },
    {
      id: "perplexity-step-5",
      step: 5,
      title: "Optimize entities for cross-corpus resolution",
      subtitle: "Perplexity ranks consensus across the web",
      body: "Perplexity weights agreement across sources. Your brand is an entity graph — website, G2 profile, LinkedIn, Crunchbase, press, Wikipedia/Wikidata if eligible. Conflicting names, URLs, or product descriptions split entity confidence and hurt ranking against competitors with clean graphs.",
      actions: [
        "Audit NAP consistency: legal name, domain, logo URL, support email across all properties.",
        "Populate sameAs in Organization schema with every authoritative profile URL.",
        "Align product naming in docs, schema, and reviews (no internal codenames on public pages).",
        "Publish a definitive /company or /about page with quotable positioning and founding facts.",
      ],
      technical: [
        {
          label: "Entity home",
          detail:
            "One canonical URL per product line; redirect legacy names with 301s.",
        },
        {
          label: "Knowledge panels",
          detail:
            "Google Knowledge Graph and Crunchbase entries should match schema name + url exactly.",
        },
        {
          label: "Review entities",
          detail:
            "G2/Capterra profiles use the same logo and description keywords as your comparison pages.",
        },
      ],
    },
    {
      id: "perplexity-step-6",
      step: 6,
      title: "Engineer answer capsules for footnote extraction",
      subtitle: "Give the synthesizer quotable blocks",
      body: "Perplexity footnotes point to pages that supplied specific claims. Pages with clear H2 questions, 40–80 word lead paragraphs, comparison tables, and attributed statistics are easier to extract than long narrative marketing. Structure every money page as a stack of capsules — one intent per H2.",
      actions: [
        "Rewrite top 10 URLs: H2 = prompt question, first paragraph = direct answer.",
        "Add comparison tables with Feature | You | Competitor columns.",
        "Include 'According to [Brand]…' stat blocks with year for attribution.",
        "Place FAQ blocks above fold on commercial pages — not hidden in tabs.",
      ],
      technical: [
        {
          label: "Capsule length",
          detail: "40–80 words per lead paragraph — matches typical model extraction windows.",
        },
        {
          label: "Table markup",
          detail: "Use semantic <table> with <th> headers; avoid image-only comparison charts.",
        },
      ],
    },
    {
      id: "perplexity-step-7",
      step: 7,
      title: "Seed the third-party corpus Perplexity already cites",
      subtitle: "Off-site evidence closes ranking gaps",
      body: "For many B2B prompts, Perplexity footnotes cluster on G2, Capterra, Hacker News, Stack Overflow, analyst reports, and niche directories — not vendor homepages. If your category answers are built from reviews and forums, you must exist there with segment-specific, keyword-rich mentions.",
      actions: [
        "List top 10 footnote domains for your prompt set; score your presence on each.",
        "Request detailed G2 reviews naming integrations and buyer segment.",
        "Answer SO threads for '[Product] vs [Competitor]' with factual doc links.",
        "Pitch comparison inclusion to publications that already appear in footnotes.",
      ],
    },
    {
      id: "perplexity-step-8",
      step: 8,
      title: "Measure Perplexity Share of Model weekly",
      subtitle: "Close the loop with rescans and proof",
      body: "Perplexity's index shifts frequently. Track citation rate per money prompt weekly: recommended in prose, footnoted, mentioned only, or absent. Tie lifts to remediation shipped — schema sprint, new vs page, review velocity — and report Perplexity SoM alongside Google rankings for the same prompts.",
      actions: [
        "Baseline SoM on Perplexity for 50+ prompts before changes.",
        "Re-scan weekly; log footnote position and competitor displacement.",
        "Ship proof report: prompt → action → citation delta for stakeholders.",
      ],
    },
  ] satisfies PerplexityPlaybookStep[],
} as const;

export const geoGuideNavSections = [
  { id: "geo-overview", label: "Overview" },
  { id: "geo-frameworks", label: "Frameworks" },
  { id: "geo-engines", label: "AI engines" },
  { id: "geo-perplexity", label: "Perplexity playbook" },
  { id: "geo-curriculum", label: "Curriculum" },
  ...geoPlaybookCurriculum.map((m) => ({
    id: m.id,
    label: `${m.number}. ${m.title.split(":")[0]?.split("—")[0]?.trim().slice(0, 28) ?? m.title}`,
  })),
  { id: "geo-seven-day", label: "7-day plan" },
  { id: "geo-checklist", label: "Checklist" },
  { id: "geo-faq", label: "FAQ" },
  { id: "geo-capture", label: "Get audit" },
] as const;
