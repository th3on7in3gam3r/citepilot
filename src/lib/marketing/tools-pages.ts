import { site } from "@/lib/site";

export type MarketingToolId =
  | "citation-checker"
  | "citation-gap-calculator"
  | "geo-playbook";

export type MarketingToolMeta = {
  id: MarketingToolId;
  path: string;
  title: string;
  shortTitle: string;
  h1: string;
  description: string;
  badge: string;
  featured?: boolean;
};

export const citationCheckerTool: MarketingToolMeta = {
  id: "citation-checker",
  path: "/tools/citation-checker",
  title: "AI Citation Checker — Is Your Brand Cited on ChatGPT?",
  shortTitle: "AI Citation Checker",
  h1: "AI Citation Checker — Is Your Brand Cited on ChatGPT?",
  description:
    "Free AI citation checker: enter your domain and one buyer question to see if ChatGPT, Perplexity, and other AI engines cite your brand — instant results, no account.",
  badge: "Most popular",
  featured: true,
};

export const citationGapCalculatorTool: MarketingToolMeta = {
  id: "citation-gap-calculator",
  path: "/tools/citation-gap-calculator",
  title: "Citation Gap Calculator — Estimate Your AI Search Opportunity",
  shortTitle: "Citation Gap Calculator",
  h1: "Citation Gap Calculator — Estimate Your AI Search Opportunity",
  description:
    "Estimate monthly AI-driven discovery you're missing, citation gap vs your industry, and projected GEO lift — then run a free audit for real citation data.",
  badge: "ROI estimate",
};

export const geoPlaybookTool: MarketingToolMeta = {
  id: "geo-playbook",
  path: "/tools/geo-playbook",
  title: "The GEO Playbook — Complete Generative Engine Optimization Guide",
  shortTitle: "GEO Playbook",
  h1: "The GEO Playbook",
  description:
    "Interactive GEO playbook with 42-item checklist, frameworks, Perplexity citation guide, 7-day rollout, and weekly GEO tips — free from CitePilot.",
  badge: "42-item checklist",
};

export const marketingTools: MarketingToolMeta[] = [
  citationCheckerTool,
  citationGapCalculatorTool,
  geoPlaybookTool,
];

export function toolCanonicalUrl(path: string): string {
  return `${site.url.replace(/\/$/, "")}${path}`;
}

export function relatedTools(currentId: MarketingToolId): MarketingToolMeta[] {
  return marketingTools.filter((t) => t.id !== currentId);
}
