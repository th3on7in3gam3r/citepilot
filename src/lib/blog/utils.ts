import type { EditorialPillarId } from "@/lib/content-strategy";
import { EDITORIAL_PILLARS } from "@/lib/content-strategy";
import type { BlogPost } from "./types";

/** Min posts in a pillar before it appears in the category grid on /blog */
export const MIN_POSTS_FOR_CATEGORY_GRID = 2;

export function formatBlogDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function formatReadTime(minutes: number): string {
  return `~${Math.max(1, minutes)} min read`;
}

export function countPostsByPillar(
  posts: BlogPost[],
): Record<EditorialPillarId, number> {
  const counts = Object.fromEntries(
    EDITORIAL_PILLARS.map((p) => [p.id, 0]),
  ) as Record<EditorialPillarId, number>;

  for (const post of posts) {
    counts[post.pillar] = (counts[post.pillar] ?? 0) + 1;
  }
  return counts;
}

export function getPostsByPillar(
  posts: BlogPost[],
  pillar: EditorialPillarId,
): BlogPost[] {
  return posts.filter((p) => p.pillar === pillar);
}

export function getPillarsForCategoryGrid(
  posts: BlogPost[],
  minPosts = MIN_POSTS_FOR_CATEGORY_GRID,
) {
  const counts = countPostsByPillar(posts);
  return EDITORIAL_PILLARS.filter((p) => (counts[p.id] ?? 0) >= minPosts);
}

export function getPillarById(id: string) {
  return EDITORIAL_PILLARS.find((p) => p.id === id);
}

export function pillarHref(id: EditorialPillarId): string {
  return `/blog/category/${id}`;
}
