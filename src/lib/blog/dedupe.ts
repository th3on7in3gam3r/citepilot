import type { BlogPost } from "@/lib/blog/types";

/** Collapse punctuation/spacing so near-identical titles dedupe. */
export function normalizeBlogTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[''`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Keep the newest post per normalized title (input should be newest-first).
 * Drops regenerated slug-1 / slug-2 clones of the same headline.
 */
export function dedupeBlogPostsByTitle<T extends Pick<BlogPost, "title" | "publishedAt" | "slug">>(
  posts: T[],
): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const post of posts) {
    const key = normalizeBlogTitle(post.title);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(post);
  }
  return out;
}
