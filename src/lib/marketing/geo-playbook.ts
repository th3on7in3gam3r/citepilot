export const geoPlaybookCurriculum = [
  {
    id: "geo-module-1",
    number: 1,
    title: "The Death of the Blue Link & Rise of RAG Architecture",
    topics: [
      {
        label: "The Paradigm Shift",
        body: "Why traditional CTR is collapsing and how Retrieval-Augmented Generation (RAG) models select references.",
      },
      {
        label: "The Mechanics of Citation",
        body: "How LLMs parse trusted data sources, technical docs, and third-party reviews to formulate answers.",
      },
      {
        label: "The Cost of Invisibility",
        body: "What happens when an LLM summarizes your entire category and leaves your brand out of the bulleted recommendations.",
      },
    ],
  },
  {
    id: "geo-module-2",
    number: 2,
    title: "Mapping Your Brand's \"Money Prompts\"",
    topics: [
      {
        label: "Defining Money Prompts",
        body: "Moving past high-volume vanity keywords to capture high-intent commercial prompts (e.g., \"What are the best enterprise alternatives to Segment for real-time data orchestration?\").",
      },
      {
        label: "The Intent Matrix",
        body: "Classification of informational, comparative, and transactional prompts utilized by modern B2B buyers.",
      },
      {
        label: "Competitor Siphoning",
        body: "Identifying the prompts where competitors are recommended and building a targeted displacement map.",
      },
    ],
  },
  {
    id: "geo-module-3",
    number: 3,
    title: "The Technical GEO Audit Checklist",
    topics: [
      {
        label: "Structured Data & Semantic Markup",
        body: "Preparing your domain for LLM crawler optimization.",
      },
      {
        label: "The 3rd-Party Authority Loop",
        body: "Uncovering the exact industry databases, directories, and forums Gemini and Perplexity use as trusted ground truths.",
      },
      {
        label: "N-gram Optimization for LLM Tokenizers",
        body: "How phrasing your product's unique value propositions matches LLM semantic embedding spaces.",
      },
    ],
  },
  {
    id: "geo-module-4",
    number: 4,
    title: "Generative Search Attribution & Reporting",
    topics: [
      {
        label: "Calculating Share of Model (SoM)",
        body: "The modern replacement for Share of Voice (SoV).",
      },
      {
        label: "The GEO Pipeline Formula",
        body: "How to attribute pipeline directly back to AI engine recommendations.",
      },
      {
        label: "Building Client-Ready Proof Reports",
        body: "Frameworks for presenting LLM visibility gains to stakeholders and board members.",
      },
    ],
  },
] as const;

export function buildPlaybookMarkdown(): string {
  const lines = [
    "# The Generative Engine Optimization (GEO) Playbook",
    "## How to Dominate B2B \"Money Prompts\" in ChatGPT, Claude, and Perplexity",
    "",
    "By Cite Pilot — getcitepilot.com",
    "",
  ];
  for (const mod of geoPlaybookCurriculum) {
    lines.push(`## Module ${mod.number}: ${mod.title}`, "");
    for (const topic of mod.topics) {
      lines.push(`### ${topic.label}`, topic.body, "");
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
    "The Generative Engine Optimization (GEO) Playbook: How to Dominate B2B \"Money Prompts\" in ChatGPT, Claude, and Perplexity",
  shortTitle: "GEO Playbook",
  description:
    "Map your B2B SaaS money prompts, audit AI citation gaps, and claim generative recommendations across ChatGPT, Claude, and Perplexity.",
  datePublished: "2026-06-02",
  dateModified: "2026-06-03",
  readingMinutes: 12,
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
      q: "What is Share of Model (SoM)?",
      a: "Share of Model is the modern replacement for Share of Voice—measuring how often your brand is cited in generative answers versus competitors for your category's money prompts.",
    },
    {
      q: "What are the top technical strategies to earn LLM citations?",
      a: "Focus on structured data and semantic markup, build a third-party authority loop across trusted directories and reviews, and align phrasing with how LLM tokenizers embed product value.",
    },
    {
      q: "How do I audit my brand's AI footprint today?",
      a: "Run Cite Pilot's 60-second citation audit to see where you are cited, which competitors win your money prompts, and the fixes required to close citation gaps on autopilot.",
    },
  ],
} as const;
