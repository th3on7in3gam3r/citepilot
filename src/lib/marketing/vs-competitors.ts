export type VsCompetitor = {
  slug: string;
  name: string;
  shortTitle: string;
  title: string;
  description: string;
  theirStrength: string;
  citePilotEdge: string;
  rows: { feature: string; them: string; us: string }[];
  faqs: { q: string; a: string }[];
};

export const vsCompetitors: VsCompetitor[] = [
  {
    slug: "semrush",
    name: "Semrush",
    shortTitle: "CitePilot vs Semrush",
    title: "CitePilot vs Semrush for AI citation monitoring",
    description:
      "Semrush excels at traditional SEO — keywords, backlinks, and rank tracking. CitePilot is built for GEO: money-prompt citation rate across ChatGPT, Perplexity, and Google AI.",
    theirStrength:
      "Semrush is a mature SEO suite with keyword research, site audits, and competitive intelligence for blue-link rankings.",
    citePilotEdge:
      "CitePilot tracks whether AI answers actually name your brand per buyer prompt — then prioritizes weekly fixes and proof reports when citations move.",
    rows: [
      {
        feature: "Primary metric",
        them: "Keyword position & organic traffic",
        us: "Citation rate per money prompt",
      },
      {
        feature: "AI answer monitoring",
        them: "Add-on visibility scores",
        us: "Core product — 8 AI engines mapped",
      },
      {
        feature: "Action output",
        them: "Dashboards & PDF exports",
        us: "Weekly prioritized GEO fixes + CMS publish",
      },
      {
        feature: "Proof for clients",
        them: "Rank change reports",
        us: "Citation delta + shareable audit links",
      },
      {
        feature: "Agency scale",
        them: "Multiple projects (tiered)",
        us: "Fleet — unlimited workspaces + white-label",
      },
    ],
    faqs: [
      {
        q: "Can I use CitePilot alongside Semrush?",
        a: "Yes. Many teams keep Semrush for keyword research and use CitePilot for AI citation monitoring and client proof.",
      },
      {
        q: "Does CitePilot replace Semrush site audits?",
        a: "CitePilot runs GEO-focused technical audits (schema, answer capsules, prompt overlap). It complements — not replaces — full technical SEO crawls.",
      },
    ],
  },
  {
    slug: "ahrefs",
    name: "Ahrefs",
    shortTitle: "CitePilot vs Ahrefs",
    title: "CitePilot vs Ahrefs for generative engine optimization",
    description:
      "Ahrefs leads on backlink index and keyword difficulty. CitePilot answers a different question: are you cited when buyers ask AI for recommendations?",
    theirStrength:
      "Ahrefs offers industry-leading backlink data, content explorer, and rank tracking for Google organic results.",
    citePilotEdge:
      "CitePilot closes the loop on AI visibility — audit gaps, ship fixes, re-scan, and show citation lift per prompt.",
    rows: [
      {
        feature: "Data focus",
        them: "Backlinks & SERP features",
        us: "LLM citation presence & gaps",
      },
      {
        feature: "Buyer intent",
        them: "Keyword volume & difficulty",
        us: "Real money prompts buyers ask AI",
      },
      {
        feature: "Competitor tracking",
        them: "Share of voice in organic",
        us: "Who AI names instead of you per prompt",
      },
      {
        feature: "Content workflow",
        them: "Content gap in SERPs",
        us: "GEO calendar tied to citation gaps",
      },
      {
        feature: "Starting price",
        them: "Paid plans from ~$99/mo",
        us: "Free citation audit, Pilot from $79/mo",
      },
    ],
    faqs: [
      {
        q: "Is CitePilot an Ahrefs alternative?",
        a: "For AI citation monitoring and GEO proof — yes. For backlink index depth, Ahrefs remains stronger; CitePilot integrates Open PageRank for authority context.",
      },
      {
        q: "Who should switch?",
        a: "Teams losing deals because ChatGPT recommends competitors — not because organic rank dropped.",
      },
    ],
  },
  {
    slug: "moz",
    name: "Moz",
    shortTitle: "CitePilot vs Moz",
    title: "CitePilot vs Moz for AI search visibility",
    description:
      "Moz popularized Domain Authority and on-page SEO. CitePilot measures what Moz cannot: your share of AI-generated answer citations.",
    theirStrength:
      "Moz provides DA/PA metrics, local SEO tools, and beginner-friendly SEO education.",
    citePilotEdge:
      "CitePilot is purpose-built for the post-search era — prompt-level citation tracking with weekly action plans.",
    rows: [
      {
        feature: "Authority metric",
        them: "Domain Authority (links)",
        us: "Citation health score (AI prompts)",
      },
      {
        feature: "Education",
        them: "SEO learning hub",
        us: "Interactive GEO Playbook + audits",
      },
      {
        feature: "Monitoring cadence",
        them: "Rank tracking schedules",
        us: "Weekly AI citation rescans",
      },
      {
        feature: "Schema & entities",
        them: "Basic site crawl issues",
        us: "FAQPage, Organization, answer capsules",
      },
      {
        feature: "Free entry",
        them: "Limited free tools",
        us: "Full free citation audit (10 prompts)",
      },
    ],
    faqs: [
      {
        q: "Does CitePilot have a Domain Authority score?",
        a: "We show domain rating from Open PageRank plus a GEO technical score — but optimize for citation rate, not DA alone.",
      },
      {
        q: "Is Moz still relevant?",
        a: "For traditional SEO, yes. For AI answer share, you need prompt-level citation data Moz doesn't provide.",
      },
    ],
  },
];

export function getVsCompetitor(slug: string): VsCompetitor | undefined {
  return vsCompetitors.find((c) => c.slug === slug);
}
