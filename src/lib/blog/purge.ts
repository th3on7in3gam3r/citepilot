import { deleteBlogPost } from "@/lib/blog/store";
import { REMOVED_BLOG_SLUGS } from "@/lib/blog/removed-slugs";

let purged = false;

/** Delete off-brand or corrupted generated posts (idempotent). */
export async function purgeRemovedBlogPosts(): Promise<void> {
  if (purged) return;
  for (const slug of REMOVED_BLOG_SLUGS) {
    await deleteBlogPost(slug);
  }
  purged = true;
}
