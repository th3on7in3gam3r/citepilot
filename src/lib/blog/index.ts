import type { BlogPost } from "./types";
import { getCitedByChatgptPost } from "./posts/get-cited-by-chatgpt";
import {
  getGeneratedPostBySlug,
  listGeneratedPosts,
  rowToBlogPost,
} from "./store";

const staticPosts: BlogPost[] = [
  { ...getCitedByChatgptPost, source: "static" },
];

export async function getAllPosts(): Promise<BlogPost[]> {
  const generated = (await listGeneratedPosts()).map(rowToBlogPost);
  const staticSlugs = new Set(staticPosts.map((p) => p.slug));
  const merged = [
    ...staticPosts,
    ...generated.filter((p) => !staticSlugs.has(p.slug)),
  ];
  return merged.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

export async function getPostBySlug(
  slug: string,
): Promise<BlogPost | undefined> {
  const staticPost = staticPosts.find((p) => p.slug === slug);
  if (staticPost) return staticPost;
  const row = await getGeneratedPostBySlug(slug);
  return row ? rowToBlogPost(row) : undefined;
}

export async function getAllSlugs(): Promise<string[]> {
  const generated = (await listGeneratedPosts()).map((r) => r.slug);
  const staticSlugs = staticPosts.map((p) => p.slug);
  return [...new Set([...staticSlugs, ...generated])];
}
