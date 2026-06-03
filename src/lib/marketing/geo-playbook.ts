export const geoPlaybookModules = [
  {
    number: 1,
    title: "The Death of the 10 Blue Links: Welcome to the GEO Era",
    body: [
      "Traditional SEO is facing its most disruptive paradigm shift since the dawn of the commercial web. Buyers now ask ChatGPT, Perplexity, and Google Gemini complex questions—and receive synthesized answers with inline citations instead of ten blue links.",
      "If your B2B SaaS platform is not cited inside these AI-generated answers, you do not exist in the modern buyer's journey. Securing citations requires Generative Engine Optimization (GEO).",
    ],
  },
  {
    number: 2,
    title: "Understanding the Retrieval-Augmented Generation (RAG) Loop",
    body: [
      "Phase 1 — Query Deconstruction: The engine interprets semantic intent and entities.",
      "Phase 2 — External Retrieval: The LLM pulls the top contextually relevant web pages from vector databases and live search APIs.",
      "Phase 3 — Context Synthesis & Citation: The model synthesizes sources into one answer with inline citations. GEO ensures you are retrieved in phase 2 and cited in phase 3.",
    ],
  },
  {
    number: 3,
    title: "What Are Money Prompts and Why Do They Matter?",
    body: [
      "Money Prompts are high-intent conversational queries at the bottom of the funnel—e.g. best enterprise CRM for mid-market manufacturing, or which SOC-2 tool has the fastest onboarding.",
      "When an LLM recommends a competitor, you lose the deal before the buyer reaches a search engine. Track Money Prompts systematically to measure share of voice inside LLM answers.",
    ],
  },
  {
    number: 4,
    title: "Three Technical Strategies to Force LLM Citations",
    body: [
      "Structural & semantic entity alignment — robust Schema.org (Product, Organization, Review) and clear subject-verb-object copy.",
      "Consensus engine footprint — presence on review aggregators, directories, and publications so models cross-reference your authority.",
      "Uncompromising content density — technical answers, definition blocks, and verifiable data that RAG pipelines prioritize over shallow pages.",
    ],
  },
  {
    number: 5,
    title: "Audit Your Brand's AI Footprint Today",
    body: [
      "Identify your top 20 Money Prompts.",
      "Test them across ChatGPT, Perplexity, and Google AI Overviews.",
      "Analyze who is cited today—and deploy monitoring to close citation gaps on autopilot.",
    ],
  },
] as const;

export function buildPlaybookMarkdown(): string {
  const lines = [
    "# GEO Strategy Playbook: Winning the AI Answer Engine",
    "",
    "By Cite Pilot — getcitepilot.com",
    "",
  ];
  for (const mod of geoPlaybookModules) {
    lines.push(`## ${mod.number}. ${mod.title}`, "");
    for (const paragraph of mod.body) {
      lines.push(paragraph, "");
    }
  }
  lines.push(
    "---",
    "",
    "Run your free citation audit: https://getcitepilot.com/audit",
  );
  return lines.join("\n");
}

export function downloadGeoPlaybook(): void {
  const blob = new Blob([buildPlaybookMarkdown()], {
    type: "text/markdown;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "citepilot-geo-strategy-playbook.md";
  anchor.click();
  URL.revokeObjectURL(url);
}

export const geoPlaybook = {
  path: "/nurture",
  title:
    "The Generative Engine Optimization (GEO) Playbook: How to Secure Citations in ChatGPT, Perplexity, and Google AI Overviews",
  shortTitle: "GEO Playbook",
  description:
    "Learn how B2B SaaS teams move from SEO to generative engine optimization: RAG mechanics, money prompts, citation strategies, and a practical AI footprint audit roadmap.",
  datePublished: "2026-06-02",
  dateModified: "2026-06-02",
  readingMinutes: 5,
  faqs: [
    {
      q: "What is Generative Engine Optimization (GEO)?",
      a: "GEO is the practice of optimizing your brand's visibility inside AI-generated answers from systems like ChatGPT, Perplexity, and Google AI Overviews. Instead of ranking for ten blue links, you secure citations and recommendations inside synthesized responses.",
    },
    {
      q: "How does Retrieval-Augmented Generation (RAG) affect my brand?",
      a: "RAG systems deconstruct the user query, retrieve the most relevant web pages from vector databases and live search APIs, then synthesize an answer with inline citations. GEO ensures your site is retrieved in step two and cited in step three.",
    },
    {
      q: "What are Money Prompts?",
      a: "Money Prompts are high-intent conversational queries prospects ask AI search engines at the bottom of the funnel—for example, comparing enterprise CRMs or asking which security tool integrates with AWS. Winning these prompts means your brand is cited when buyers are ready to purchase.",
    },
    {
      q: "Why do LLMs need JSON-LD and FAQ schema?",
      a: "Structured data gives crawlers explicit facts about your organization, products, and Q&A content. FAQPage and TechArticle JSON-LD reduce ambiguity so generative engines can extract verifiable answers and attribute citations to your domain with higher confidence.",
    },
    {
      q: "What are the top technical strategies to earn LLM citations?",
      a: "Focus on semantic entity alignment with Schema.org markup, build a consensus footprint across review sites and publications, and publish high-density content with clear definitions, lists, and direct answers that RAG pipelines can chunk and retrieve.",
    },
    {
      q: "How do I audit my brand's AI footprint today?",
      a: "List your top Money Prompts, test them across ChatGPT, Perplexity, and Google AI Overviews, analyze which competitors are cited, then deploy automated monitoring. Cite Pilot tracks prompt-level citation share of voice and surfaces fixes on autopilot.",
    },
  ],
} as const;
