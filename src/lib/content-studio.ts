/** Old Content hub sections that moved to other dashboard areas. */
export const CONTENT_STUDIO_LEGACY_SECTION_REDIRECTS: Record<string, string> = {
  competitors: "/dashboard/competitors",
  keywords: "/dashboard/analytics",
};

export function contentStudioLegacyRedirect(
  section: string | null,
): string | null {
  if (!section) return null;
  return CONTENT_STUDIO_LEGACY_SECTION_REDIRECTS[section] ?? null;
}

export function buildGenerateArticleHref(input: {
  topic: string;
  brief?: string;
  format?: string;
  pillar?: string;
}): string {
  const params = new URLSearchParams({ section: "generate" });
  if (input.topic.trim()) params.set("topic", input.topic.trim());
  if (input.brief?.trim()) params.set("brief", input.brief.trim());
  if (input.format?.trim()) params.set("format", input.format.trim());
  if (input.pillar?.trim()) params.set("pillar", input.pillar.trim());
  return `/dashboard/content?${params.toString()}`;
}
