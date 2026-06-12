"use client";

import { useMemo, useState } from "react";
import type { BlogPost } from "@/lib/blog/types";
import { BlogPostCard } from "@/components/blog/BlogPostCard";

type PostSummary = Pick<
  BlogPost,
  | "slug"
  | "title"
  | "description"
  | "pillar"
  | "audience"
  | "author"
  | "publishedAt"
  | "readingMinutes"
>;

export function BlogSearch({
  posts,
  featuredSlug,
}: {
  posts: PostSummary[];
  featuredSlug?: string;
}) {
  const [query, setQuery] = useState("");

  const listPosts = useMemo(() => {
    const rest = featuredSlug
      ? posts.filter((p) => p.slug !== featuredSlug)
      : posts;
    const q = query.trim().toLowerCase();
    if (!q) return rest;
    return rest.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.author.name.toLowerCase().includes(q),
    );
  }, [posts, query, featuredSlug]);

  return (
    <div>
      <label className="block">
        <span className="sr-only">Search articles</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search articles…"
          className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-accent"
        />
      </label>

      <div className="mt-8 space-y-5">
        {listPosts.length === 0 ? (
          <p className="text-center text-sm text-white/50">
            No articles match &ldquo;{query}&rdquo;.
          </p>
        ) : (
          listPosts.map((post) => (
            <BlogPostCard key={post.slug} post={post as BlogPost} />
          ))
        )}
      </div>
    </div>
  );
}
