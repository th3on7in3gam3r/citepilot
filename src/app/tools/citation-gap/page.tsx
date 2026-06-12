import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MarketingDarkHero } from "@/components/marketing/MarketingDarkHero";
import { CitationGapCalculator } from "@/components/tools/CitationGapCalculator";
import { Container } from "@/components/ui/Container";
import { clampMetaDescription, clampSeoTitle } from "@/lib/seo/meta";
import type { Metadata } from "next";

const title = "Citation Gap Calculator";
const description =
  "Estimate your AI citation gap and monthly discovery opportunity. Enter domain, industry, and competitors — then run a free audit for real data.";

export const metadata: Metadata = {
  title: clampSeoTitle(title),
  description: clampMetaDescription(description),
  alternates: { canonical: "/tools/citation-gap" },
  openGraph: {
    title: `${title} | CitePilot`,
    description: clampMetaDescription(description),
    url: "/tools/citation-gap",
    type: "website",
  },
};

export default function CitationGapPage() {
  return (
    <>
      <Header light overlay />
      <main className="bg-[#04060c]">
        <MarketingDarkHero
          eyebrow="ROI calculator"
          title="What's my citation gap?"
          description="Illustrative model for teams evaluating GEO. Pair with a free audit to see real citation rates per money prompt."
        />

        <Container className="py-14 md:py-20">
          <CitationGapCalculator />

          <p className="mx-auto mt-10 max-w-xl text-center text-xs text-white/40">
            Estimates are deterministic placeholders — not live AI scans. For
            actual citation data,{" "}
            <Link href="/audit" className="text-white/55 underline">
              run the free audit
            </Link>
            .
          </p>
        </Container>
      </main>
      <Footer />
    </>
  );
}
