import type { ArticleBrief, ArticleBriefInput } from "./types";
import { CONTENT_TYPE_LABELS, WORD_TARGETS } from "./constants";

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function primaryKeyword(topic: string): string {
  return topic.toLowerCase().trim().replace(/\s+/g, " ");
}

export function buildArticleBrief(input: ArticleBriefInput): ArticleBrief {
  const kw = primaryKeyword(input.topic);
  const title = titleCase(
    input.angle?.trim() ||
      input.topic.replace(/^\w/, (c) => c.toUpperCase()),
  );

  const intent =
    input.contentType === "comparison"
      ? "Commercial investigation"
      : input.contentType === "tutorial"
        ? "Informational / how-to"
        : input.contentType === "news"
          ? "Informational / timely"
          : "Informational / topical authority";

  const metaTitle =
    title.length <= 58 ? `${title} | CitePilot` : `${title.slice(0, 52)}… | CitePilot`;

  return {
    topic: input.topic,
    audience: input.audience,
    contentType: input.contentType,
    primaryKeyword: kw,
    semanticKeywords: [
      kw,
      `${kw} guide`,
      "generative engine optimization",
      "AI search visibility",
      "LLM citations",
      "answer engine optimization",
      "ChatGPT visibility",
    ],
    searchIntent: intent,
    suggestedTitle: title,
    metaTitle: metaTitle.slice(0, 60),
    metaDescription: `Learn ${kw} with practical steps for Google and AI engines. ${CONTENT_TYPE_LABELS[input.contentType]}.`,
    outline: [
      {
        heading: "TL;DR",
        bullets: [
          "2–3 sentence extractable summary for AI engines",
          "State who this is for and the outcome",
        ],
      },
      {
        heading: "Why this matters now",
        bullets: [
          "Open with a problem, stat, or tension — no filler intros",
          "Contrast Google rankings vs AI citations",
        ],
      },
      {
        heading: "Core framework",
        bullets: [
          "Definition-style paragraph quotable by LLMs",
          "Step-by-step or numbered process",
          "Real tool examples (Ahrefs, Semrush, Surfer, etc.)",
        ],
      },
      {
        heading: "Implementation checklist",
        bullets: [
          "On-page: schema, internal links, answer capsules",
          "Off-page: mentions on HN, SO, authoritative publications",
          input.angle ? `Angle: ${input.angle}` : "Tie actions to measurable citation lift",
        ],
      },
      {
        heading: "FAQ",
        bullets: [
          "Minimum 4 questions mirroring ChatGPT-style queries",
          "Direct answers in 2–4 sentences each",
        ],
      },
      {
        heading: "Key takeaways",
        bullets: [
          "3–5 bullet bottom line",
          "CTA to CitePilot audit or workspace",
        ],
      },
    ],
    faqPrompts: [
      `What is ${kw}?`,
      `How long does it take to see results for ${kw}?`,
      `What tools help with ${kw}?`,
      `How is ${kw} different from traditional SEO?`,
    ],
    schemaTypes: ["Article", "FAQPage", input.contentType === "tutorial" ? "HowTo" : "Article"],
    internalLinkTopics: [
      "GEO audit checklist",
      "How to track AI citations",
      "Schema for FAQ and Organization",
    ],
    geoNotes: [
      "Include 2+ statistics with named sources",
      "Use 'According to [source]…' for attributions",
      "Add comparison table if commercial intent",
      `Target ~${WORD_TARGETS[input.contentType]} words`,
    ],
  };
}
