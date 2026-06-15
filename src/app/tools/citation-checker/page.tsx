import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MarketingDarkHero } from "@/components/marketing/MarketingDarkHero";
import {
  CitationCheckerSeoArticle,
} from "@/components/tools/CitationCheckerSeoArticle";
import { CitationCheckerTool } from "@/components/tools/CitationCheckerTool";
import { RelatedTools } from "@/components/tools/RelatedTools";
import { ToolSoftwareApplicationJsonLd } from "@/components/tools/ToolSoftwareApplicationJsonLd";
import { Container } from "@/components/ui/Container";
import { citationCheckerTool } from "@/lib/marketing/tools-pages";
import { clampMetaDescription, clampSeoTitle } from "@/lib/seo/meta";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: clampSeoTitle(citationCheckerTool.title),
  description: clampMetaDescription(citationCheckerTool.description),
  alternates: { canonical: citationCheckerTool.path },
  openGraph: {
    title: citationCheckerTool.title,
    description: clampMetaDescription(citationCheckerTool.description),
    url: citationCheckerTool.path,
    type: "website",
  },
};

export default function CitationCheckerToolPage() {
  return (
    <>
      <ToolSoftwareApplicationJsonLd tool={citationCheckerTool} />
      <Header light overlay />
      <main className="bg-[#04060c]">
        <MarketingDarkHero
          eyebrow="Free tool"
          title={citationCheckerTool.h1}
          description={citationCheckerTool.description}
        />

        <Container className="py-14 md:py-20">
          <CitationCheckerTool />
          <CitationCheckerSeoArticle />
          <RelatedTools currentId="citation-checker" />
        </Container>
      </main>
      <Footer />
    </>
  );
}
