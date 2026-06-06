import { site } from "@/lib/site";

const META_DESC_MAX = 160;
const META_DESC_MIN = 110;

/** Layout template appends ` · CitePilot` — keep total SERP title under 60 chars. */
export const SERP_TITLE_MAX = 60;
const TITLE_TEMPLATE_SUFFIX = ` · ${site.name}`;

/** Max length for the `%s` segment before the layout title template suffix. */
export const SEO_TITLE_MAX = SERP_TITLE_MAX - TITLE_TEMPLATE_SUFFIX.length;

/** Trim meta descriptions for search snippets (≈110–160 chars). */
export function clampMetaDescription(
  text: string,
  max = META_DESC_MAX,
): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;

  const truncated = cleaned.slice(0, max);
  const sentenceEnd = Math.max(
    truncated.lastIndexOf(". "),
    truncated.lastIndexOf("! "),
    truncated.lastIndexOf("? "),
  );
  if (sentenceEnd >= META_DESC_MIN - 20) {
    return truncated.slice(0, sentenceEnd + 1).trim();
  }

  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace > META_DESC_MIN - 30) {
    return truncated.slice(0, lastSpace).trim();
  }
  return truncated.trim();
}

const TRAILING_TITLE_STOP_WORDS =
  /\s+(in|for|a|an|the|to|and|or|of|with|at|by|if)$/i;

function trimTitleFragment(text: string): string {
  let trimmed = text.replace(/[:;,\-–—]\s*$/, "").trim();
  while (TRAILING_TITLE_STOP_WORDS.test(trimmed)) {
    trimmed = trimmed.replace(TRAILING_TITLE_STOP_WORDS, "").trim();
  }
  return trimmed;
}

/** Trim page titles for SERP display (total length ≈60 incl. site suffix). */
export function clampSeoTitle(text: string, max = SEO_TITLE_MAX): string {
  const cleaned = trimTitleFragment(
    text.replace(/\s*[|·]\s*CitePilot\s*$/i, "").replace(/\s+/g, " ").trim(),
  );
  if (cleaned.length <= max) return cleaned;

  const truncated = cleaned.slice(0, max);
  const lastSpace = truncated.lastIndexOf(" ");
  const cut =
    lastSpace > 20 ? truncated.slice(0, lastSpace).trim() : truncated.trim();
  return trimTitleFragment(cut);
}
