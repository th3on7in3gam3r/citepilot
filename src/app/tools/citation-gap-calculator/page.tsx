import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MarketingDarkHero } from "@/components/marketing/MarketingDarkHero";
import { CitationGapCalculator } from "@/components/tools/CitationGapCalculator";
import { RelatedTools } from "@/components/tools/RelatedTools";
import { ToolSoftwareApplicationJsonLd } from "@/components/tools/ToolSoftwareApplicationJsonLd";
import { Container } from "@/components/ui/Container";
import { citationGapCalculatorTool } from "@/lib/marketing/tools-pages";
import { clampMetaDescription, clampSeoTitle } from "@/lib/seo/meta";
import type { Metadata } from "next";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: clampSeoTitle(citationGapCalculatorTool.title),
  description: clampMetaDescription(citationGapCalculatorTool.description),
  alternates: { canonical: citationGapCalculatorTool.path },
  openGraph: {
    title: citationGapCalculatorTool.title,
    description: clampMetaDescription(citationGapCalculatorTool.description),
    url: citationGapCalculatorTool.path,
    type: "website",
  },
};

export default function CitationGapCalculatorPage() {
  return (
    <>
      <ToolSoftwareApplicationJsonLd tool={citationGapCalculatorTool} />
      <Header light overlay />
      <main id="main-content" tabIndex={-1} className="bg-[#04060c]">
        <MarketingDarkHero
          eyebrow="Free tool"
          title={citationGapCalculatorTool.h1}
          description={citationGapCalculatorTool.description}
        />

        <Container className="py-14 md:py-20">
          <CitationGapCalculator />
          <RelatedTools currentId="citation-gap-calculator" />
        </Container>
      </main>
      <Footer />
    </>
  );
}
