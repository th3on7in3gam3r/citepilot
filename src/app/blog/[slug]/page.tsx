import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleBody } from "@/components/blog/ArticleBody";
import { ArticleJsonLd } from "@/components/blog/ArticleJsonLd";
import { ArticleReadingProgress } from "@/components/blog/ArticleReadingProgress";
import { BlogArticleCta } from "@/components/blog/BlogPostCover";
import { BlogLayout } from "@/components/blog/BlogLayout";
import { BlogNewsletterSignup } from "@/components/blog/BlogNewsletterSignup";
import { BlogPostMeta } from "@/components/blog/BlogPostMeta";
import { MarkdownArticle } from "@/components/blog/MarkdownArticle";
import { Container } from "@/components/ui/Container";
import { getPostBySlug, getAllSlugs } from "@/lib/blog";
import { blogPostImageUrl } from "@/lib/blog/covers";
import { pillarHref } from "@/lib/blog/utils";
import { clampMetaDescription, clampSeoTitle } from "@/lib/seo/meta";
import { site } from "@/lib/site";
import { EDITORIAL_PILLARS } from "@/lib/content-strategy";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 86400;

/** Allow runtime slugs when DB was empty/unavailable at build time. */
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const slugs = await getAllSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch (error) {
    console.warn(
      "[blog] generateStaticParams fallback:",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  const description = clampMetaDescription(post.description);
  const title = clampSeoTitle(post.seoTitle);
  const canonical = `${site.url}/blog/${post.slug}`;
  const ogImage = blogPostImageUrl(post);
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: post.title,
      description,
      type: "article",
      publishedTime: post.publishedAt,
      authors: [post.author.name],
      images: [{ url: ogImage, alt: post.coverImageAlt ?? post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: [ogImage],
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
      <ArticleReadingProgress />
      <BlogLayout>
        <Container className="px-4 pb-16 pt-28 md:pt-32">
          <Link
            href="/blog"
            className="text-sm font-medium text-glow transition hover:text-white"
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
            <h1 className="content-page-title mt-4 text-white">
              {post.title}
            </h1>
            <p className="content-page-lead mt-4 text-white/60">
              {description}
            </p>
          </header>

          <div id="blog-article-content" className="mt-10">
            {post.markdown ? (
              <MarkdownArticle markdown={post.markdown} dark />
            ) : (
              <ArticleBody post={post} dark />
            )}
          </div>

          <div className="mx-auto mt-12 max-w-3xl space-y-8">
            <BlogArticleCta />
            <BlogNewsletterSignup variant="card" />
          </div>
        </Container>
      </BlogLayout>
    </>
  );
}
