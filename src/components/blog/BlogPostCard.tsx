import Link from "next/link";
import type { BlogPost } from "@/lib/blog/types";
import { excerptLines } from "@/lib/blog/covers";
import { formatBlogDate, formatReadTime, pillarHref } from "@/lib/blog/utils";
import { BlogPostCover } from "@/components/blog/BlogPostCover";
import { EDITORIAL_PILLARS } from "@/lib/content-strategy";

function CardBody({
  post,
  featured,
}: {
  post: BlogPost;
  featured?: boolean;
}) {
  const pillar = EDITORIAL_PILLARS.find((p) => p.id === post.pillar);

  return (
    <div className={featured ? "p-8 md:p-10" : "p-6"}>
      {featured && (
        <p className="text-xs font-semibold uppercase tracking-wider text-glow">
          Featured
        </p>
      )}

      {pillar && (
        <Link
          href={pillarHref(post.pillar)}
          className={`inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-glow transition hover:border-accent/40 hover:text-white ${
            featured ? "mt-3" : ""
          }`}
        >
          {pillar.title}
        </Link>
      )}

      <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-white/50">
        <span className="font-medium text-white/80">{post.author.name}</span>
        <span aria-hidden>·</span>
        <time dateTime={post.publishedAt}>{formatBlogDate(post.publishedAt)}</time>
        <span aria-hidden>·</span>
        <span>{formatReadTime(post.readingMinutes)}</span>
      </p>

      <h2
        className={`font-display font-bold text-white ${
          featured
            ? "mt-4 text-2xl md:text-3xl"
            : "mt-3 text-xl md:text-2xl"
        }`}
      >
        <Link href={`/blog/${post.slug}`} className="hover:text-glow">
          {post.title}
        </Link>
      </h2>

      <p
        className={`mt-3 line-clamp-2 leading-relaxed text-white/55 ${
          featured ? "max-w-2xl text-base" : "text-sm"
        }`}
      >
        {excerptLines(post.description)}
      </p>

      <Link
        href={`/blog/${post.slug}`}
        className={`inline-flex font-semibold text-glow transition hover:text-white ${
          featured ? "mt-6 rounded-full bg-accent px-6 py-3 text-sm text-white hover:bg-accent-deep" : "mt-4 text-sm"
        }`}
      >
        Read article →
      </Link>
    </div>
  );
}

export function BlogPostCard({
  post,
  featured = false,
}: {
  post: BlogPost;
  featured?: boolean;
}) {
  if (featured) {
    return (
      <article className="overflow-hidden rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/10 to-white/[0.04] backdrop-blur-sm transition hover:border-accent/40 md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Link href={`/blog/${post.slug}`} className="block md:min-h-[16rem]">
          <BlogPostCover
            pillarId={post.pillar}
            coverImageUrl={post.coverImageUrl}
            coverImageAlt={post.coverImageAlt}
            title={post.title}
            variant="featured"
          />
        </Link>
        <CardBody post={post} featured />
      </article>
    );
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm transition hover:border-accent/30">
      <Link href={`/blog/${post.slug}`} className="block">
        <BlogPostCover
          pillarId={post.pillar}
          coverImageUrl={post.coverImageUrl}
          coverImageAlt={post.coverImageAlt}
          title={post.title}
          variant="card"
        />
      </Link>
      <CardBody post={post} />
    </article>
  );
}
