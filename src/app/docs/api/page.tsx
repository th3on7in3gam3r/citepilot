import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ApiDocsContent } from "@/components/marketing/ApiDocsContent";
import { MarketingDarkHero } from "@/components/marketing/MarketingDarkHero";
import { Container } from "@/components/ui/Container";
import { apiDocsLanding } from "@/lib/marketing/api-docs-content";
import { clampMetaDescription, clampSeoTitle } from "@/lib/seo/meta";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: clampSeoTitle(apiDocsLanding.shortTitle),
  description: clampMetaDescription(apiDocsLanding.description),
  alternates: { canonical: apiDocsLanding.path },
  openGraph: {
    title: apiDocsLanding.title,
    description: clampMetaDescription(apiDocsLanding.description),
    url: apiDocsLanding.path,
    type: "website",
  },
};

export default function ApiDocsPage() {
  return (
    <>
      <Header light overlay />
      <main className="bg-[#04060c]">
        <MarketingDarkHero
          eyebrow="Developers"
          title={apiDocsLanding.title}
          description={apiDocsLanding.description}
        >
          <p className="mt-6 text-sm text-white/45">
            Fleet plan required.{" "}
            <Link href="/agency" className="text-glow hover:underline">
              Agency & Fleet overview →
            </Link>
          </p>
        </MarketingDarkHero>

        <Container className="py-14 md:py-20">
          <ApiDocsContent />
        </Container>
      </main>
      <Footer />
    </>
  );
}
