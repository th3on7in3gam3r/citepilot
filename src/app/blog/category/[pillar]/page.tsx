import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogLayout } from "@/components/blog/BlogLayout";
import { BlogNewsletterSignup } from "@/components/blog/BlogNewsletterSignup";
import { BlogPillarChips } from "@/components/blog/BlogCategoryGrid";
import { BlogPostCard } from "@/components/blog/BlogPostCard";
import { MarketingDarkHero } from "@/components/marketing/MarketingDarkHero";
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
      <MarketingDarkHero
        eyebrow="Topic"
        title={pillar.title}
        description={pillar.description}
      >
        <Link
          href="/blog"
          className="mt-6 inline-block text-sm text-white/50 hover:text-glow"
        >
          ← All articles
        </Link>
      </MarketingDarkHero>

      <Container className="py-14 md:py-20">
        <BlogPillarChips activePillarId={pillar.id} />

        <div className="mt-10 space-y-5">
          {posts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 px-6 py-12 text-center">
              <p className="font-display text-lg font-bold text-white">
                No articles in this topic yet
              </p>
              <p className="mt-2 text-sm text-white/50">
                We&apos;re publishing more on {pillar.title.toLowerCase()} soon.
              </p>
              <Link
                href="/blog"
                className="mt-6 inline-block text-sm font-semibold text-glow"
              >
                Browse all articles →
              </Link>
            </div>
          ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {posts.map((post) => (
              <BlogPostCard key={post.slug} post={post} />
            ))}
          </div>
        )}
        </div>

        <div className="mt-14">
          <BlogNewsletterSignup variant="card" />
        </div>
      </Container>
    </BlogLayout>
  );
}
