import { FeatureSuite } from "@/components/home/FeatureSuite";
import { Pillars } from "@/components/home/Pillars";
import { StickyProductShowcase } from "@/components/home/StickyProductShowcase";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { FreeToolsSection } from "@/components/marketing/FreeToolsSection";
import { MarketingDarkHero } from "@/components/marketing/MarketingDarkHero";
import { ProductTransparencySection } from "@/components/marketing/ProductTransparencySection";
import { Container } from "@/components/ui/Container";
import { productLanding } from "@/lib/marketing/product-landing";
import { positioning } from "@/lib/content";
import { clampMetaDescription, clampSeoTitle } from "@/lib/seo/meta";
import type { Metadata } from "next";
import Link from "next/link";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: clampSeoTitle(productLanding.shortTitle),
  description: clampMetaDescription(productLanding.description),
  alternates: { canonical: productLanding.path },
  openGraph: {
    title: productLanding.title,
    description: clampMetaDescription(productLanding.description),
    url: productLanding.path,
    type: "website",
  },
  twitter: {
    title: productLanding.shortTitle,
    description: clampMetaDescription(productLanding.description),
  },
};

export default function ProductPage() {
  return (
    <>
      <Header light overlay />
      <main id="main-content" tabIndex={-1} className="bg-[#04060c]">
        <MarketingDarkHero
          eyebrow="Product"
          title="Citation intelligence built for GEO teams"
          description={positioning.oneLiner}
        >
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/audit"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#7b93f0] via-[#6b8cff] to-accent px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(107,140,255,0.3)] transition hover:opacity-95"
            >
              Start free audit
            </Link>
            <Link
              href="/citation-checker"
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/[0.08]"
            >
              Try citation checker
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-white/55 transition hover:text-white/80"
            >
              Pricing
            </Link>
          </div>
        </MarketingDarkHero>

        <ProductTransparencySection onDarkCanvas showFaqs />
        <FeatureSuite />
        <Pillars />
        <StickyProductShowcase />
        <FreeToolsSection variant="dark" />

        <section className="border-t border-white/[0.06] bg-ink py-16 text-white md:py-20">
          <Container className="text-center">
            <h2 className="font-display text-2xl font-bold md:text-3xl">
              Ready to see where you&apos;re cited?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-white/60 md:text-base">
              Run a free 60-second audit — live probes where configured, plus GEO
              estimates across eight engines. No credit card.
            </p>
            <Link
              href="/audit"
              className="mt-8 inline-flex rounded-full bg-accent px-8 py-3 text-sm font-semibold text-white transition hover:bg-accent-deep"
            >
              Run citation audit →
            </Link>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
