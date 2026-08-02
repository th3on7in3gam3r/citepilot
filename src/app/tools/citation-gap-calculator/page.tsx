import { CitationGapCalculator } from "@/components/tools/CitationGapCalculator";
import { RelatedTools } from "@/components/tools/RelatedTools";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { ToolSoftwareApplicationJsonLd } from "@/components/tools/ToolSoftwareApplicationJsonLd";
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
    <ToolPageShell
      title={citationGapCalculatorTool.h1}
      description={citationGapCalculatorTool.description}
      jsonLd={<ToolSoftwareApplicationJsonLd tool={citationGapCalculatorTool} />}
    >
      <CitationGapCalculator />
      <RelatedTools currentId="citation-gap-calculator" />
    </ToolPageShell>
  );
}
