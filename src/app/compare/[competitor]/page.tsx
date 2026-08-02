import { ComparisonPage } from "@/components/marketing/ComparisonPage";
import {
  competitorMetaDescription,
  competitorPageTitle,
  competitors,
  getCompetitor,
} from "@/lib/data/competitors";
import { clampMetaDescription, clampSeoTitle } from "@/lib/seo/meta";
import { site } from "@/lib/site";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const revalidate = 86400;

type Props = { params: Promise<{ competitor: string }> };

function normalizeSlug(raw: string): string {
  return raw.replace(/^vs-/, "").toLowerCase();
}

export function generateStaticParams() {
  return competitors.map((c) => ({ competitor: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { competitor: raw } = await params;
  const competitor = getCompetitor(normalizeSlug(raw));
  if (!competitor) return {};

  const title = competitorPageTitle(competitor.name);
  const description = competitorMetaDescription(competitor);

  return {
    title: clampSeoTitle(title),
    description: clampMetaDescription(description),
    alternates: {
      canonical: `${site.url.replace(/\/$/, "")}/compare/${competitor.slug}`,
    },
    openGraph: {
      title,
      description: clampMetaDescription(description),
      url: `/compare/${competitor.slug}`,
      type: "website",
    },
  };
}

export default async function CompareCompetitorPage({ params }: Props) {
  const { competitor: raw } = await params;
  const competitor = getCompetitor(normalizeSlug(raw));
  if (!competitor) notFound();

  return <ComparisonPage competitor={competitor} />;
}
