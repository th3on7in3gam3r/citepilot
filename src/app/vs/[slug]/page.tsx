import { VsCompetitorPage } from "@/components/marketing/VsCompetitorPage";
import {
  getVsCompetitor,
  vsCompetitors,
} from "@/lib/marketing/vs-competitors";
import { clampMetaDescription, clampSeoTitle } from "@/lib/seo/meta";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return vsCompetitors.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const competitor = getVsCompetitor(slug);
  if (!competitor) return {};

  return {
    title: clampSeoTitle(competitor.shortTitle),
    description: clampMetaDescription(competitor.description),
    alternates: { canonical: `/vs/${competitor.slug}` },
    openGraph: {
      title: competitor.title,
      description: clampMetaDescription(competitor.description),
      url: `/vs/${competitor.slug}`,
      type: "website",
    },
  };
}

export default async function VsPage({ params }: Props) {
  const { slug } = await params;
  const competitor = getVsCompetitor(slug);
  if (!competitor) notFound();

  return <VsCompetitorPage competitor={competitor} />;
}
