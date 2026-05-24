import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleBody } from "@/components/blog/ArticleBody";
import { MarkdownArticle } from "@/components/blog/MarkdownArticle";
import { ArticleJsonLd } from "@/components/blog/ArticleJsonLd";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/ui/Container";
import { getPostBySlug } from "@/lib/blog";
import { AUDIENCE_LABELS } from "@/lib/content-strategy";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.seoTitle,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.publishedAt,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  return (
    <>
      <ArticleJsonLd post={post} />
      <Header />
      <main className="bg-white pt-24 pb-16">
        <Container>
          <Link href="/blog" className="text-sm font-medium text-accent hover:underline">
            ← Blog
          </Link>
          <header className="mx-auto mt-6 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              {AUDIENCE_LABELS[post.audience]} · {post.readingMinutes} min read
            </p>
            <h1 className="font-display mt-3 text-3xl font-bold tracking-tight text-ink md:text-4xl">
              {post.title}
            </h1>
            <p className="mt-4 text-lg text-muted">{post.description}</p>
          </header>
          <div className="mt-10">
            {post.markdown ? (
              <MarkdownArticle markdown={post.markdown} />
            ) : (
              <ArticleBody post={post} />
            )}
          </div>
          <div className="mx-auto mt-12 max-w-3xl rounded-2xl border border-accent/30 bg-accent/5 p-6 text-center">
            <p className="font-display text-lg font-bold text-ink">
              See if AI already cites you
            </p>
            <p className="mt-2 text-sm text-muted">
              Run a free citation audit on your domain — baseline → act → prove lift.
            </p>
            <Link
              href="/audit"
              className="mt-4 inline-flex rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white"
            >
              Run free audit
            </Link>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
