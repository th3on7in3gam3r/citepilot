import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ApiDocsPageContent } from "@/components/docs/ApiDocsPageContent";
import { MarketingDarkHero } from "@/components/marketing/MarketingDarkHero";
import { Container } from "@/components/ui/Container";
import { apiDocsLanding } from "@/lib/marketing/api-docs-data";
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
      <main id="main-content" tabIndex={-1} className="bg-[#04060c]">
        <MarketingDarkHero
          eyebrow="Developers"
          title={apiDocsLanding.title}
          description={apiDocsLanding.description}
        >
          <p className="mt-6 text-sm text-white/45">
            Base URL:{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-glow">
              https://getcitepilot.com/api/v1
            </code>
            {" · "}
            <Link href="/agency" className="text-glow hover:underline">
              Fleet overview →
            </Link>
          </p>
        </MarketingDarkHero>

        <Container className="py-14 md:py-20">
          <ApiDocsPageContent />
        </Container>
      </main>
      <Footer />
    </>
  );
}
