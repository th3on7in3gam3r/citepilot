import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { GeoPlaybookJsonLd } from "@/components/marketing/GeoPlaybookJsonLd";
import { GeoGuideArticle } from "@/components/marketing/GeoGuideArticle";
import { GeoPlaybookEmailGate } from "@/components/tools/GeoPlaybookEmailGate";
import { RelatedTools } from "@/components/tools/RelatedTools";
import { ToolSoftwareApplicationJsonLd } from "@/components/tools/ToolSoftwareApplicationJsonLd";
import { Container } from "@/components/ui/Container";
import { geoPlaybook } from "@/lib/marketing/geo-playbook";
import { geoPlaybookTool as toolMeta } from "@/lib/marketing/tools-pages";
import { site } from "@/lib/site";
import { clampMetaDescription } from "@/lib/seo/meta";

const pageUrl = `${site.url.replace(/\/$/, "")}${geoPlaybook.path}`;

export const metadata: Metadata = {
  title: geoPlaybook.shortTitle,
  description: clampMetaDescription(geoPlaybook.description),
  alternates: { canonical: geoPlaybook.path },
  openGraph: {
    title: geoPlaybook.title,
    description: clampMetaDescription(geoPlaybook.description),
    url: pageUrl,
    type: "article",
    publishedTime: geoPlaybook.datePublished,
    modifiedTime: geoPlaybook.dateModified,
  },
};

export default function GeoPlaybookToolPage() {
  return (
    <>
      <GeoPlaybookJsonLd />
      <ToolSoftwareApplicationJsonLd tool={toolMeta} />
      <Header />
      <main id="main-content" tabIndex={-1} className="bg-cream pt-16 md:pt-[4.5rem]">
        <Container className="border-b border-border py-6">
          <p className="text-xs text-muted">
            Last updated:{" "}
            <time dateTime={geoPlaybook.dateModified}>
              {new Date(geoPlaybook.dateModified).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </time>
          </p>
        </Container>
        <GeoGuideArticle emailGate={<GeoPlaybookEmailGate />} />
        <Container className="pb-16">
          <RelatedTools currentId="geo-playbook" />
        </Container>
      </main>
      <Footer />
    </>
  );
}
