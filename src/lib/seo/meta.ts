const META_DESC_MAX = 170;

/** Trim meta descriptions for search snippets (≈110–170 chars). */
export function clampMetaDescription(
  text: string,
  max = META_DESC_MAX,
): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;

  const truncated = cleaned.slice(0, max);
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace > 80) {
    return truncated.slice(0, lastSpace).trim();
  }
  return truncated.trim();
}
