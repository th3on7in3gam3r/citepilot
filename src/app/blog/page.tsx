import type { Metadata } from "next";
import {
  BlogCategoryGrid,
  BlogPillarChips,
} from "@/components/blog/BlogCategoryGrid";
import { BlogLayout } from "@/components/blog/BlogLayout";
import { BlogNewsletterSignup } from "@/components/blog/BlogNewsletterSignup";
import { BlogPostCard } from "@/components/blog/BlogPostCard";
import { BlogSearch } from "@/components/blog/BlogSearch";
import { MarketingDarkHero } from "@/components/marketing/MarketingDarkHero";
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

  return (
    <BlogLayout>
      <MarketingDarkHero
        eyebrow="CitePilot editorial"
        title="GEO & SEO guides for teams who measure citations"
        description="Practical playbooks on Google rankings, LLM citations, and technical SEO — written for clarity in search and AI answers."
      />

      <Container className="py-14 md:py-20">
        <BlogPillarChips />

        {gridPillars.length > 0 ? (
          <BlogCategoryGrid pillars={gridPillars} counts={counts} />
        ) : (
          <p className="mt-8 text-sm text-white/45">
            More topic sections unlock as we publish — browse all articles below
            or filter by topic above.
          </p>
        )}

        {featured && (
          <div className="mt-12">
            <BlogPostCard post={featured} featured />
          </div>
        )}

        {posts.length > 1 ? (
          <div className="mt-12">
            <h2 className="font-display text-lg font-bold text-white">
              All articles
            </h2>
            <div className="mt-6">
              <BlogSearch posts={posts} featuredSlug={featured?.slug} />
            </div>
          </div>
        ) : (
          !featured && (
            <p className="mt-12 text-center text-white/50">
              New guides publishing soon.
            </p>
          )
        )}

        <div className="mt-14">
          <BlogNewsletterSignup variant="card" />
        </div>
      </Container>
    </BlogLayout>
  );
}
