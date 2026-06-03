import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { GeoPlaybookJsonLd } from "@/components/marketing/GeoPlaybookJsonLd";
import { InteractiveArticle } from "@/components/marketing/InteractiveArticle";
import { geoPlaybook } from "@/lib/marketing/geo-playbook";
import { site } from "@/lib/site";

const pageUrl = `${site.url.replace(/\/$/, "")}${geoPlaybook.path}`;

export const metadata: Metadata = {
  title: geoPlaybook.shortTitle,
  description: geoPlaybook.description,
  alternates: { canonical: geoPlaybook.path },
  openGraph: {
    title: geoPlaybook.title,
    description: geoPlaybook.description,
    url: pageUrl,
    type: "article",
    publishedTime: geoPlaybook.datePublished,
    modifiedTime: geoPlaybook.dateModified,
  },
};

export default function NurturePage() {
  return (
    <>
      <GeoPlaybookJsonLd />
      <Header />
      <main className="bg-cream pt-24">
        <InteractiveArticle />
      </main>
      <Footer />
    </>
  );
}
