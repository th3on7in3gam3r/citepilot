import type { Metadata } from "next";
import {
  BlogCategoryGrid,
  BlogPillarChips,
} from "@/components/blog/BlogCategoryGrid";
import { BlogHero } from "@/components/blog/BlogHero";
import { BlogLayout } from "@/components/blog/BlogLayout";
import { BlogNewsletterSignup } from "@/components/blog/BlogNewsletterSignup";
import { BlogPostCard } from "@/components/blog/BlogPostCard";
import { BlogSearch } from "@/components/blog/BlogSearch";
import { Container } from "@/components/ui/Container";
import {
  countPostsByPillar,
  getAllPostSummaries,
  getPillarsForCategoryGrid,
} from "@/lib/blog";
import { site } from "@/lib/site";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "GEO, SEO & AI Citation Guides",
  description:
    "SEO, GEO, and AI citation playbooks for founders, agencies, and SaaS teams — from CitePilot.",
  alternates: { canonical: `${site.url}/blog` },
};

export default async function BlogIndexPage() {
  const posts = await getAllPostSummaries();
  const counts = countPostsByPillar(posts);
  const gridPillars = getPillarsForCategoryGrid(posts);
  const featured = posts[0];
  const topicCount = gridPillars.length;

  return (
    <BlogLayout>
      <BlogHero
        eyebrow="CitePilot editorial"
        title="GEO & SEO guides for teams who measure citations"
        description="Practical playbooks on Google rankings, LLM citations, and technical SEO — written for clarity in search and AI answers."
        stats={[
          { value: String(posts.length), label: posts.length === 1 ? "guide" : "guides" },
          ...(topicCount > 0
            ? [{ value: String(topicCount), label: topicCount === 1 ? "topic" : "topics" }]
            : []),
        ]}
      />

      <Container className="pb-16 pt-10 md:pb-24 md:pt-12">
        {featured && (
          <section aria-labelledby="featured-heading">
            <h2 id="featured-heading" className="sr-only">
              Featured article
            </h2>
            <BlogPostCard post={featured} featured />
          </section>
        )}

        <div className={featured ? "mt-10" : ""}>
          <BlogPillarChips />
        </div>

        {posts.length > 1 ? (
          <section className="mt-12" aria-labelledby="articles-heading">
            <BlogSearch
              posts={posts}
              featuredSlug={featured?.slug}
              totalCount={posts.length - (featured ? 1 : 0)}
            />
          </section>
        ) : (
          !featured && (
            <p className="mt-12 text-center text-white/50">
              New guides publishing soon.
            </p>
          )
        )}

        {gridPillars.length > 0 ? (
          <BlogCategoryGrid pillars={gridPillars} counts={counts} />
        ) : (
          posts.length > 0 && (
            <p className="mt-16 text-center text-sm text-white/40">
              More topic sections unlock as we publish additional guides.
            </p>
          )
        )}

        <div className="mt-16 md:mt-20">
          <BlogNewsletterSignup variant="card" />
        </div>
      </Container>
    </BlogLayout>
  );
}
