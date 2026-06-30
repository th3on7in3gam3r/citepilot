import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogLayout } from "@/components/blog/BlogLayout";
import { BlogHero } from "@/components/blog/BlogHero";
import { BlogNewsletterSignup } from "@/components/blog/BlogNewsletterSignup";
import { BlogPillarChips } from "@/components/blog/BlogCategoryGrid";
import { BlogPostCard } from "@/components/blog/BlogPostCard";
import { Container } from "@/components/ui/Container";
import {
  getAllPostSummaries,
  getPillarById,
  getPostsByPillar,
} from "@/lib/blog";
import type { EditorialPillarId } from "@/lib/content-strategy";
import { EDITORIAL_PILLARS } from "@/lib/content-strategy";

export const revalidate = 1800;

type Props = { params: Promise<{ pillar: string }> };

export function generateStaticParams() {
  return EDITORIAL_PILLARS.map((p) => ({ pillar: p.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pillar: raw } = await params;
  const pillar = getPillarById(raw);
  if (!pillar) return {};
  return {
    title: `${pillar.title} — CitePilot Blog`,
    description: pillar.description,
  };
}

export default async function BlogCategoryPage({ params }: Props) {
  const { pillar: raw } = await params;
  const pillar = getPillarById(raw);
  if (!pillar) notFound();

  const posts = getPostsByPillar(
    await getAllPostSummaries(),
    pillar.id as EditorialPillarId,
  );

  return (
    <BlogLayout>
      <BlogHero
        eyebrow="Topic"
        title={pillar.title}
        description={pillar.description}
        stats={[
          {
            value: String(posts.length),
            label: posts.length === 1 ? "article" : "articles",
          },
        ]}
      >
        <Link
          href="/blog"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-white/50 transition hover:text-glow"
        >
          <span aria-hidden>←</span> All articles
        </Link>
      </BlogHero>

      <Container className="pb-16 pt-10 md:pb-24 md:pt-12">
        <BlogPillarChips activePillarId={pillar.id} />

        <section className="mt-10" aria-labelledby="topic-articles-heading">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <h2
              id="topic-articles-heading"
              className="font-display text-2xl font-bold text-white md:text-3xl"
            >
              Articles in this topic
            </h2>
            {posts.length > 0 && (
              <p className="text-sm text-white/45">
                {posts.length} article{posts.length === 1 ? "" : "s"}
              </p>
            )}
          </div>

          {posts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/12 px-6 py-14 text-center">
              <p className="font-display text-lg font-bold text-white">
                No articles in this topic yet
              </p>
              <p className="mt-2 text-sm text-white/50">
                We&apos;re publishing more on {pillar.title.toLowerCase()} soon.
              </p>
              <Link
                href="/blog"
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-glow transition hover:text-white"
              >
                Browse all articles <span aria-hidden>→</span>
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <BlogPostCard key={post.slug} post={post} />
              ))}
            </div>
          )}
        </section>

        <div className="mt-16 md:mt-20">
          <BlogNewsletterSignup variant="card" />
        </div>
      </Container>
    </BlogLayout>
  );
}
