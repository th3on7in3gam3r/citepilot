import { deleteBlogPost } from "@/lib/blog/store";
import { REMOVED_BLOG_SLUGS } from "@/lib/blog/removed-slugs";

let purged = false;

/** Delete off-brand or corrupted generated posts (idempotent). */
export async function purgeRemovedBlogPosts(): Promise<void> {
  if (purged) return;
  try {
    for (const slug of REMOVED_BLOG_SLUGS) {
      await deleteBlogPost(slug);
    }
    purged = true;
  } catch (error) {
    // Neon quota / build-time DB outages must not fail next build.
    const message = error instanceof Error ? error.message : String(error);
    console.warn("[blog] purgeRemovedBlogPosts skipped:", message);
  }
}
