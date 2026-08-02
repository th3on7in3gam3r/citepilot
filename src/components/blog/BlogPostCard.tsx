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
    <div className={featured ? "flex flex-col justify-center p-8 md:p-10" : "p-6"}>
      {featured && (
        <p className="inline-flex w-fit items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-glow">
          <span className="h-1 w-1 rounded-full bg-glow" aria-hidden />
          Featured guide
        </p>
      )}

      {pillar && (
        <Link
          href={pillarHref(post.pillar)}
          className={`inline-flex w-fit rounded-full border border-white/12 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-glow transition hover:border-accent/40 hover:text-white ${
            featured ? "mt-4" : ""
          }`}
        >
          {pillar.title}
        </Link>
      )}

      <h2
        className={`font-display font-bold text-white ${
          featured
            ? "mt-4 text-2xl leading-snug md:text-3xl lg:text-[2rem]"
            : "mt-3 text-xl leading-snug md:text-[1.35rem]"
        }`}
      >
        <Link
          href={`/blog/${post.slug}`}
          className="transition hover:text-glow"
        >
          {post.title}
        </Link>
      </h2>

      <p
        className={`mt-3 line-clamp-2 leading-relaxed text-white/55 ${
          featured ? "max-w-xl text-base" : "text-sm"
        }`}
      >
        {excerptLines(post.description, featured ? 200 : 140)}
      </p>

      <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-white/45">
        <span className="font-medium text-white/70">{post.author.name}</span>
        <span aria-hidden>·</span>
        <time dateTime={post.publishedAt}>{formatBlogDate(post.publishedAt)}</time>
        <span aria-hidden>·</span>
        <span>{formatReadTime(post.readingMinutes)}</span>
      </p>

      <Link
        href={`/blog/${post.slug}`}
        className={`inline-flex w-fit items-center gap-1.5 font-semibold transition ${
          featured
            ? "mt-6 rounded-full bg-accent px-6 py-3 text-sm text-white hover:bg-accent-deep"
            : "mt-5 text-sm text-glow hover:gap-2.5 hover:text-white"
        }`}
      >
        Read article
        <span aria-hidden>→</span>
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
      <article className="group overflow-hidden rounded-2xl border border-accent/25 bg-gradient-to-br from-accent/[0.12] via-white/[0.03] to-transparent shadow-[0_4px_40px_rgba(14,165,233,0.08)] transition hover:border-accent/40 hover:shadow-[0_8px_48px_rgba(14,165,233,0.16)] lg:grid lg:grid-cols-[1.1fr_1fr]">
        <Link
          href={`/blog/${post.slug}`}
          className="relative block min-h-[14rem] overflow-hidden lg:min-h-[20rem]"
        >
          <BlogPostCover
            pillarId={post.pillar}
            coverImageUrl={post.coverImageUrl}
            coverImageAlt={post.coverImageAlt}
            title={post.title}
            variant="featured"
            className="h-full transition duration-500 group-hover:scale-[1.02]"
          />
        </Link>
        <CardBody post={post} featured />
      </article>
    );
  }

  return (
    <article className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition duration-300 hover:-translate-y-0.5 hover:border-accent/25 hover:bg-white/[0.05] hover:shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
      <Link href={`/blog/${post.slug}`} className="relative block overflow-hidden">
        <BlogPostCover
          pillarId={post.pillar}
          coverImageUrl={post.coverImageUrl}
          coverImageAlt={post.coverImageAlt}
          title={post.title}
          variant="card"
          className="transition duration-500 group-hover:scale-[1.03]"
        />
        <span className="absolute right-3 top-3 rounded-full border border-white/15 bg-black/40 px-2.5 py-1 text-[11px] font-semibold text-white/80 backdrop-blur-sm">
          {formatReadTime(post.readingMinutes)}
        </span>
      </Link>
      <CardBody post={post} />
    </article>
  );
}
