/** Generated posts removed from public blog (wrong topic / metadata). */
export const REMOVED_BLOG_SLUGS = [
  "target-focus-closes-your-primary-citation-gap",
] as const;

export function isRemovedBlogSlug(slug: string): boolean {
  return (REMOVED_BLOG_SLUGS as readonly string[]).includes(slug);
}
