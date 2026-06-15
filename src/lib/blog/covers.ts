import type { EditorialPillarId } from "@/lib/content-strategy";
import { site } from "@/lib/site";

/** Gradient placeholders for blog cards when no cover image exists. */
export const PILLAR_GRADIENTS: Record<
  EditorialPillarId,
  { from: string; via: string; to: string; accent: string }
> = {
  "seo-automation": {
    from: "#6366f1",
    via: "#4f46e5",
    to: "#0ea5e9",
    accent: "text-indigo-200",
  },
  geo: {
    from: "#0ea5e9",
    via: "#06b6d4",
    to: "#10b981",
    accent: "text-cyan-100",
  },
  "technical-seo": {
    from: "#64748b",
    via: "#475569",
    to: "#0ea5e9",
    accent: "text-slate-200",
  },
  "local-seo": {
    from: "#f59e0b",
    via: "#ea580c",
    to: "#0ea5e9",
    accent: "text-amber-100",
  },
  "paid-organic": {
    from: "#a855f7",
    via: "#7c3aed",
    to: "#0ea5e9",
    accent: "text-purple-100",
  },
  "agency-growth": {
    from: "#14b8a6",
    via: "#0d9488",
    to: "#0ea5e9",
    accent: "text-teal-100",
  },
};

export function blogPostImageUrl(_slug: string): string {
  return `${site.url.replace(/\/$/, "")}/opengraph-image`;
}

export function excerptLines(text: string, maxChars = 160): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= maxChars) return clean;
  const cut = clean.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}
