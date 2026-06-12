import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MarketingDarkHero } from "@/components/marketing/MarketingDarkHero";
import { CitationCheckerTool } from "@/components/tools/CitationCheckerTool";
import { Container } from "@/components/ui/Container";
import { clampMetaDescription, clampSeoTitle } from "@/lib/seo/meta";
import type { Metadata } from "next";

const title = "Free AI Citation Checker";
const description =
  "Enter your domain and one buyer question. See instantly if you're likely cited in AI answers — free, no account required.";

export const metadata: Metadata = {
  title: clampSeoTitle(title),
  description: clampMetaDescription(description),
  alternates: { canonical: "/citation-checker" },
  openGraph: {
    title: `${title} | CitePilot`,
    description: clampMetaDescription(description),
    url: "/citation-checker",
    type: "website",
  },
};

export default function CitationCheckerPage() {
  return (
    <>
      <Header light overlay />
      <main className="bg-[#04060c]">
        <MarketingDarkHero
          eyebrow="Free tool"
          title="AI citation checker"
          description="GEO is new — most teams don't know where they stand. Check one money prompt against your domain in under a minute."
        />

        <Container className="py-14 md:py-20">
          <CitationCheckerTool />

          <div className="mx-auto mt-14 max-w-2xl text-center">
            <p className="text-sm text-white/50">
              Need the full picture?{" "}
              <Link href="/audit" className="font-semibold text-glow hover:underline">
                Run a free 10-prompt audit
              </Link>{" "}
              or estimate your gap with the{" "}
              <Link
                href="/tools/citation-gap"
                className="font-semibold text-glow hover:underline"
              >
                citation gap calculator
              </Link>
              .
            </p>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
