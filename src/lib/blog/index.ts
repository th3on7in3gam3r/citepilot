import type { BlogPost } from "./types";
import { getCitedByChatgptPost } from "./posts/get-cited-by-chatgpt";
import { dedupeBlogPostsByTitle } from "./dedupe";
import { purgeRemovedBlogPosts } from "./purge";
import { isRemovedBlogSlug } from "./removed-slugs";
import { resolvePublicCover } from "./stock-covers";
import {
  getGeneratedPostBySlug,
  listGeneratedPostSummaries,
  listGeneratedPosts,
  rowToBlogPost,
  rowToBlogPostSummary,
} from "./store";

const staticPosts: BlogPost[] = [
  { ...getCitedByChatgptPost, source: "static" },
];

function isPublicPost(post: BlogPost): boolean {
  return !isRemovedBlogSlug(post.slug);
}

function withPublicCover(post: BlogPost): BlogPost {
  const cover = resolvePublicCover({
    slug: post.slug,
    pillar: post.pillar,
    coverImageUrl: post.coverImageUrl,
    coverImageAlt: post.coverImageAlt,
  });
  return {
    ...post,
    coverImageUrl: cover.coverImageUrl,
    coverImageAlt: cover.coverImageAlt,
  };
}

function finalizePublicPosts(posts: BlogPost[]): BlogPost[] {
  return dedupeBlogPostsByTitle(
    posts
      .filter(isPublicPost)
      .map(withPublicCover)
      .sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
      ),
  );
}

function staticPublicPosts(): BlogPost[] {
  return finalizePublicPosts(staticPosts);
}

function logBlogDbFallback(context: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`[blog] ${context}: database unavailable, using static posts`, message);
}

export async function getAllPosts(): Promise<BlogPost[]> {
  try {
    await purgeRemovedBlogPosts();
    const generated = (await listGeneratedPosts()).map(rowToBlogPost);
    const staticSlugs = new Set(staticPosts.map((p) => p.slug));
    const merged = [
      ...staticPosts,
      ...generated.filter((p) => !staticSlugs.has(p.slug)),
    ];
    return finalizePublicPosts(merged);
  } catch (error) {
    logBlogDbFallback("getAllPosts", error);
    return staticPublicPosts();
  }
}

/** Index-safe post list — excludes markdown and section bodies. */
export async function getAllPostSummaries(): Promise<BlogPost[]> {
  try {
    await purgeRemovedBlogPosts();
    const generated = (await listGeneratedPostSummaries()).map(
      rowToBlogPostSummary,
    );
    const staticSlugs = new Set(staticPosts.map((p) => p.slug));
    const staticSummaries = staticPosts.map(
      ({ markdown: _md, sections, faqs, takeaways, ...summary }) => ({
        ...summary,
        sections,
        faqs,
        takeaways,
      }),
    );
    const merged = [
      ...staticSummaries,
      ...generated.filter((p) => !staticSlugs.has(p.slug)),
    ];
    return finalizePublicPosts(merged);
  } catch (error) {
    logBlogDbFallback("getAllPostSummaries", error);
    return staticPublicPosts().map(
      ({ markdown: _md, sections, faqs, takeaways, ...summary }) => ({
        ...summary,
        sections,
        faqs,
        takeaways,
      }),
    );
  }
}

export async function getPostBySlug(
  slug: string,
): Promise<BlogPost | undefined> {
  if (isRemovedBlogSlug(slug)) return undefined;
  const staticPost = staticPosts.find((p) => p.slug === slug);
  if (staticPost) return withPublicCover(staticPost);

  try {
    await purgeRemovedBlogPosts();
    const row = await getGeneratedPostBySlug(slug);
    if (!row) return undefined;
    return withPublicCover(rowToBlogPost(row));
  } catch (error) {
    logBlogDbFallback(`getPostBySlug(${slug})`, error);
    return undefined;
  }
}

export async function getAllSlugs(): Promise<string[]> {
  try {
    const posts = await getAllPosts();
    return posts.map((p) => p.slug);
  } catch (error) {
    logBlogDbFallback("getAllSlugs", error);
    return staticPublicPosts().map((p) => p.slug);
  }
}

export {
  countPostsByPillar,
  formatBlogDate,
  formatReadTime,
  getPillarById,
  getPillarsForCategoryGrid,
  getPostsByPillar,
  MIN_POSTS_FOR_CATEGORY_GRID,
  pillarHref,
} from "./utils";
export type { BlogAuthor, BlogPost, BlogSection } from "./types";
export { DEFAULT_BLOG_AUTHOR, getBlogAuthor } from "./types";
