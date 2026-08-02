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
  | "coverImageUrl"
  | "coverImageAlt"
>;

function SearchIcon() {
  return (
    <svg
      className="h-4 w-4 text-white/35"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
      />
    </svg>
  );
}

export function BlogSearch({
  posts,
  featuredSlug,
  totalCount,
}: {
  posts: PostSummary[];
  featuredSlug?: string;
  totalCount?: number;
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

  const countLabel =
    totalCount ?? (featuredSlug ? posts.length - 1 : posts.length);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="blog-section-eyebrow">Library</p>
          <h2 className="blog-section-title mt-1">
            {query.trim() ? "Search results" : "Latest articles"}
          </h2>
        </div>
        {!query.trim() && countLabel > 0 && (
          <p className="text-sm text-white/45">
            {countLabel} article{countLabel === 1 ? "" : "s"}
          </p>
        )}
      </div>

      <label className="relative mt-6 block">
        <span className="sr-only">Search articles</span>
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
          <SearchIcon />
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, topic, or author…"
          className="w-full rounded-xl border border-white/12 bg-white/[0.04] py-3.5 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/30 transition focus:border-accent/50 focus:bg-white/[0.06] focus:ring-1 focus:ring-accent/20"
        />
      </label>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {listPosts.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-white/12 px-6 py-14 text-center">
            <p className="font-display text-lg font-bold text-white">
              No articles match &ldquo;{query}&rdquo;
            </p>
            <p className="mt-2 text-sm text-white/45">
              Try a different keyword or browse by topic above.
            </p>
          </div>
        ) : (
          listPosts.map((post) => (
            <BlogPostCard key={post.slug} post={post as BlogPost} />
          ))
        )}
      </div>
    </div>
  );
}
