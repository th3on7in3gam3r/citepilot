import Link from "next/link";
import type { BlogPost } from "@/lib/blog/types";
import { formatReadTime, pillarHref } from "@/lib/blog/utils";
import { BlogPostMeta } from "@/components/blog/BlogPostMeta";
import { clampMetaDescription } from "@/lib/seo/meta";
import { AUDIENCE_LABELS, EDITORIAL_PILLARS } from "@/lib/content-strategy";

export function BlogPostCard({
  post,
  featured = false,
}: {
  post: BlogPost;
  featured?: boolean;
}) {
  const pillar = EDITORIAL_PILLARS.find((p) => p.id === post.pillar);

  if (featured) {
    return (
      <article className="rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/15 to-white/[0.04] p-8 md:p-10">
        <p className="text-xs font-semibold uppercase tracking-wider text-glow">
          Featured
        </p>
        {pillar && (
          <Link
            href={pillarHref(post.pillar)}
            className="mt-3 inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80 transition hover:border-accent/40 hover:text-white"
          >
            {pillar.title}
          </Link>
        )}
        <div className="mt-3">
          <BlogPostMeta post={post} />
        </div>
        <h2 className="font-display mt-4 text-2xl font-bold text-white md:text-3xl">
          <Link href={`/blog/${post.slug}`} className="hover:text-glow">
            {post.title}
          </Link>
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/60">
          {clampMetaDescription(post.description)}
        </p>
        <Link
          href={`/blog/${post.slug}`}
          className="mt-6 inline-flex rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-deep"
        >
          Read article →
        </Link>
      </article>
    );
  }

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm transition hover:border-accent/30">
      <div className="flex flex-wrap gap-2 text-xs font-semibold">
        {pillar && (
          <Link
            href={pillarHref(post.pillar)}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-glow transition hover:border-accent/40"
          >
            {pillar.title}
          </Link>
        )}
        <span className="rounded-full bg-white/5 px-3 py-1 text-white/45">
          {AUDIENCE_LABELS[post.audience]}
        </span>
        <span className="rounded-full bg-white/5 px-3 py-1 text-white/45">
          {formatReadTime(post.readingMinutes)}
        </span>
      </div>
      <div className="mt-3">
        <BlogPostMeta post={post} />
      </div>
      <h2 className="font-display mt-3 text-xl font-bold text-white md:text-2xl">
        <Link href={`/blog/${post.slug}`} className="hover:text-glow">
          {post.title}
        </Link>
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-white/55">
        {clampMetaDescription(post.description)}
      </p>
      <Link
        href={`/blog/${post.slug}`}
        className="mt-4 inline-block text-sm font-semibold text-glow hover:text-white"
      >
        Read article →
      </Link>
    </article>
  );
}
