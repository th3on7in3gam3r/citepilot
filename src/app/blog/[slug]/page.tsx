import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleBody } from "@/components/blog/ArticleBody";
import { ArticleJsonLd } from "@/components/blog/ArticleJsonLd";
import { BlogLayout } from "@/components/blog/BlogLayout";
import { BlogNewsletterSignup } from "@/components/blog/BlogNewsletterSignup";
import { BlogPostMeta } from "@/components/blog/BlogPostMeta";
import { MarkdownArticle } from "@/components/blog/MarkdownArticle";
import { Container } from "@/components/ui/Container";
import { getPostBySlug } from "@/lib/blog";
import { pillarHref } from "@/lib/blog/utils";
import { clampMetaDescription, clampSeoTitle } from "@/lib/seo/meta";
import { EDITORIAL_PILLARS } from "@/lib/content-strategy";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  const description = clampMetaDescription(post.description);
  const title = clampSeoTitle(post.seoTitle);
  return {
    title,
    description,
    openGraph: {
      title: post.title,
      description,
      type: "article",
      publishedTime: post.publishedAt,
      authors: [post.author.name],
    },
    twitter: {
      title: post.title,
      description,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();
  const description = clampMetaDescription(post.description);
  const pillar = EDITORIAL_PILLARS.find((p) => p.id === post.pillar);

  return (
    <>
      <ArticleJsonLd post={post} />
      <BlogLayout>
        <Container className="px-4 pt-28 pb-16 md:pt-32">
          <Link
            href="/blog"
            className="text-sm font-medium text-glow hover:text-white"
          >
            ← Blog
          </Link>

          <header className="mx-auto mt-6 max-w-3xl">
            <div className="flex flex-wrap gap-2">
              {pillar && (
                <Link
                  href={pillarHref(post.pillar)}
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/70 transition hover:border-accent/40 hover:text-glow"
                >
                  {pillar.title}
                </Link>
              )}
            </div>
            <BlogPostMeta post={post} />
            <h1 className="font-display mt-4 text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-[2.75rem]">
              {post.title}
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-white/60">
              {description}
            </p>
          </header>

          <div className="mt-10">
            {post.markdown ? (
              <MarkdownArticle markdown={post.markdown} dark />
            ) : (
              <ArticleBody post={post} dark />
            )}
          </div>

          <div className="mx-auto mt-12 max-w-3xl">
            <BlogNewsletterSignup variant="card" />
          </div>

          <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center">
            <p className="font-display text-lg font-bold text-white">
              See if AI already cites you
            </p>
            <p className="mt-2 text-sm text-white/55">
              Run a free citation audit on your domain — baseline, act, prove
              lift.
            </p>
            <Link
              href="/audit"
              className="mt-4 inline-flex rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-deep"
            >
              Run free audit
            </Link>
          </div>
        </Container>
      </BlogLayout>
    </>
  );
}
