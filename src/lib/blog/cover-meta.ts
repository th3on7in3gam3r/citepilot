/** Parse cover image from markdown HTML comments (generated posts). */
export function parseCoverImageMeta(markdown: string): {
  coverImageUrl?: string;
  coverImageAlt?: string;
} {
  const coverImageUrl = markdown
    .match(/<!--\s*cover-image:\s*(.+?)\s*-->/i)?.[1]
    ?.trim();
  const coverImageAlt = markdown
    .match(/<!--\s*cover-image-alt:\s*(.+?)\s*-->/i)?.[1]
    ?.trim();

  return {
    ...(coverImageUrl ? { coverImageUrl: normalizeCoverUrl(coverImageUrl) } : {}),
    ...(coverImageAlt ? { coverImageAlt } : {}),
  };
}

export function normalizeCoverUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("/")) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return "";
}

export function isValidCoverUrl(url: string): boolean {
  return Boolean(normalizeCoverUrl(url));
}
