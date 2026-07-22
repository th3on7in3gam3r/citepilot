import { CitationCheckerSeoArticle } from "@/components/tools/CitationCheckerSeoArticle";
import { CitationCheckerTool } from "@/components/tools/CitationCheckerTool";
import { RelatedTools } from "@/components/tools/RelatedTools";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { ToolSoftwareApplicationJsonLd } from "@/components/tools/ToolSoftwareApplicationJsonLd";
import { citationCheckerTool } from "@/lib/marketing/tools-pages";
import { clampMetaDescription, clampSeoTitle } from "@/lib/seo/meta";
import type { Metadata } from "next";

export const revalidate = 3600;

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
    <ToolPageShell
      title={citationCheckerTool.h1}
      description={citationCheckerTool.description}
      jsonLd={<ToolSoftwareApplicationJsonLd tool={citationCheckerTool} />}
    >
      <CitationCheckerTool />
      <CitationCheckerSeoArticle />
      <RelatedTools currentId="citation-checker" />
    </ToolPageShell>
  );
}
