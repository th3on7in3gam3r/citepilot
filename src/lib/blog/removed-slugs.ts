/** Generated posts removed from public blog (wrong topic / duplicate regenerations). */
export const REMOVED_BLOG_SLUGS = [
  /** Title about citation gap; description wrongly referenced church web design agencies. */
  "target-focus-closes-your-primary-citation-gap",

  // Duplicate weekly regenerations — keep only the newest of each title series.
  "light-weekly-roundup-for-founders",
  "light-weekly-roundup-for-founders-1",
  "light-weekly-roundup-for-founders-2",
  "light-weekly-roundup-for-founders-3",
  "light-weekly-roundup-for-founders-4",
  "friday-trend-brief-client-ready-talking-points",
  "friday-trend-brief-client-ready-talking-points-1",
  "fri-friday-trend-brief-client-ready-talking-points",
  "saturday-local-focus-gbp-and-service-area-pages",
  "saturday-local-focus-gbp-and-service-area-pages-1",
] as const;

export function isRemovedBlogSlug(slug: string): boolean {
  return (REMOVED_BLOG_SLUGS as readonly string[]).includes(slug);
}
