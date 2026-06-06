import {
  geoFrameworks,
  geoImplementationChecklist,
  geoPlaybookCurriculum,
  geoSevenDayPlan,
  type GeoModule,
} from "./geo-playbook-content";

export {
  geoEngines,
  geoFrameworks,
  geoGuideNavSections,
  geoImplementationChecklist,
  geoPlaybookCurriculum,
  geoSevenDayPlan,
} from "./geo-playbook-content";
export type {
  GeoChecklistItem,
  GeoFramework,
  GeoModule,
  GeoModuleTopic,
  GeoSevenDayTask,
} from "./geo-playbook-content";

export function buildPlaybookMarkdown(): string {
  const lines = [
    "# The Generative Engine Optimization (GEO) Playbook",
    "## Complete guide to money prompts, RAG citations, and Share of Model",
    "",
    "By CitePilot — getcitepilot.com",
    "",
    "## Frameworks",
    "",
  ];

  for (const fw of geoFrameworks) {
    lines.push(`### ${fw.acronym}: ${fw.name}`, "", fw.tagline, "");
    for (const pillar of fw.pillars) {
      lines.push(`**${pillar.label}** — ${pillar.body}`, "");
    }
    lines.push(`_Apply when:_ ${fw.applyWhen}`, "");
  }

  for (const mod of geoPlaybookCurriculum) {
    lines.push(`## Module ${mod.number}: ${mod.title}`, "", mod.summary, "");
    for (const topic of mod.topics) {
      lines.push(`### ${topic.label}`, topic.body, "");
      if (topic.bullets?.length) {
        for (const b of topic.bullets) lines.push(`- ${b}`);
        lines.push("");
      }
    }
  }

  lines.push("## 7-Day Implementation Plan", "");
  for (const day of geoSevenDayPlan) {
    lines.push(`### Day ${day.day}: ${day.title}`, day.outcome, "");
    for (const t of day.tasks) lines.push(`- ${t}`);
    lines.push("");
  }

  lines.push("## Implementation Checklist", "");
  for (const item of geoImplementationChecklist) {
    lines.push(`- [ ] **${item.label}** — ${item.detail}`);
  }

  lines.push(
    "",
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
    "The Complete GEO Playbook: Money Prompts, RAG Citations & Share of Model",
  shortTitle: "GEO Playbook — Complete Guide",
  description:
    "Interactive GEO guide: RAG citation stack, ACE & CITE frameworks, money prompts, technical audit checklist, 7-day rollout, and Share of Model measurement.",
  datePublished: "2026-06-02",
  dateModified: "2026-06-03",
  readingMinutes: 35,
  faqs: [
    {
      q: "What is Generative Engine Optimization (GEO)?",
      a: "GEO is the practice of optimizing your brand's visibility inside AI-generated answers from ChatGPT, Perplexity, Gemini, Claude, and Google AI Overviews. Instead of ranking for ten blue links, you secure citations and recommendations inside synthesized responses.",
    },
    {
      q: "How does the RAG citation stack work?",
      a: "Retrieval-Augmented Generation follows four steps: Retrieve candidate sources, Rank them by trust and relevance, Synthesize a narrative, and Cite survivors in the answer. GEO interventions target whichever step drops your brand.",
    },
    {
      q: "What are money prompts?",
      a: "Money prompts are high-intent conversational queries prospects ask AI engines at the bottom of the funnel — comparisons, alternatives, best-for, pricing, and integration questions. Winning them means your brand is cited when buyers are ready to purchase.",
    },
    {
      q: "What is the ACE framework in GEO?",
      a: "ACE stands for Authority, Clarity, and Extractability — the on-page triangle for LLM-friendly content. Authority builds trust, clarity enables accurate quoting, and extractability structures answer capsules models can lift without distortion.",
    },
    {
      q: "What is Share of Model (SoM)?",
      a: "Share of Model measures how often your brand is cited or recommended versus competitors across your money-prompt set. It replaces Share of Voice for AI-mediated discovery and should be tracked weekly with re-scans.",
    },
    {
      q: "How is GEO different from SEO?",
      a: "SEO optimizes for rankings and clicks on search engine result pages. GEO optimizes for inclusion in AI answers — extractability, third-party corroboration, and prompt-aligned content. Dual-track optimization shares crawlability and schema foundations.",
    },
    {
      q: "What technical fixes improve LLM citations fastest?",
      a: "Unblock AI crawlers where policy allows, ship Organization + Product + FAQ schema, publish comparison and alternatives pages with tables, and align FAQ copy verbatim with money prompts.",
    },
    {
      q: "How do I audit my brand's AI footprint today?",
      a: "Run CitePilot's 60-second citation audit to see where you are cited, which competitors win your money prompts, and the fixes required to close citation gaps — then track SoM weekly.",
    },
  ],
} as const;

/** @deprecated Use geoPlaybookCurriculum from geo-playbook-content */
export type LegacyCurriculumModule = GeoModule;
