import type { AudienceSegment, ContentType, EditorialPillarId } from "./types";

export const BANNED_PHRASES = [
  "in today's digital landscape",
  "it's worth noting",
  "in conclusion",
  "delve into",
  "game-changer",
  "leverage synergies",
  "at the end of the day",
] as const;

export const AUDIENCE_LABELS: Record<AudienceSegment, string> = {
  "growth-marketing": "Growth / Marketing Team",
  "solo-founder": "Solo Founder / Blogger",
  agency: "Marketing Agency",
  ecommerce: "E-Commerce Brand",
  saas: "SaaS Company",
};

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  pillar: "Pillar (3,000–4,000 words)",
  tutorial: "Tutorial (1,500–2,500 words)",
  comparison: "Comparison (2,000–3,000 words)",
  news: "News / trend (1,000–1,500 words)",
};

export const WORD_TARGETS: Record<ContentType, number> = {
  pillar: 3500,
  tutorial: 2000,
  comparison: 2500,
  news: 1200,
};

export const EDITORIAL_PILLARS: {
  id: EditorialPillarId;
  title: string;
  description: string;
}[] = [
  {
    id: "seo-automation",
    title: "SEO & Content Automation",
    description: "Tools, workflows, strategies, and AI-assisted writing that still ranks.",
  },
  {
    id: "geo",
    title: "GEO & LLM Citations",
    description: "Getting cited by ChatGPT, Perplexity, Gemini, Claude, Grok, and DeepSeek.",
  },
  {
    id: "technical-seo",
    title: "Technical SEO",
    description: "Audits, schema, Core Web Vitals, crawlability, and site health.",
  },
  {
    id: "local-seo",
    title: "Local SEO",
    description: "GBP, citations, geogrids, and local authority.",
  },
  {
    id: "paid-organic",
    title: "Paid + Organic Synergy",
    description: "Smart Ads, Google Ads, and SEO + PPC working together.",
  },
  {
    id: "agency-growth",
    title: "Agency Growth",
    description: "White-label SEO, client reporting, and scaling operations.",
  },
];

/** Intentionally not automated — documented for editors */
export const BYPASS_FOR_NOW = [
  "Auto-syndication to Reddit (use Discussions: HN + Stack Overflow instead)",
  "AI detection score APIs (ZeroGPT, GPTZero) — manual check if needed",
  "Automated GSC/GA monthly reporting — wire when analytics connects",
  "Guest post / press release outreach automation",
  "Publishing 3–5 posts/week without editorial review",
] as const;
