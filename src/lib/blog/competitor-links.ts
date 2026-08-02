/** Auto-link competitor names in blog markdown to /compare pages (first occurrence per name). */
const COMPETITOR_LINKS: { name: string; href: string }[] = [
  { name: "Semrush", href: "/compare/semrush" },
  { name: "Ahrefs", href: "/compare/ahrefs" },
  { name: "Moz", href: "/compare/moz" },
  { name: "BrightEdge", href: "/compare/brightedge" },
  { name: "Conductor", href: "/compare/conductor" },
];

export function linkCompetitorNamesInMarkdown(markdown: string): string {
  let result = markdown;
  for (const { name, href } of COMPETITOR_LINKS) {
    const linked = `[${name}](${href})`;
    if (result.includes(linked)) continue;
    const re = new RegExp(`\\b${name}\\b`);
    result = result.replace(re, linked);
  }
  return result;
}
