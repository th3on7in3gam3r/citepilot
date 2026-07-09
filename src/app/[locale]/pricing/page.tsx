import Link from "next/link";
import { ProductHuntPromoBar } from "@/components/launch/ProductHuntPromoBar";
import { PricingFaqAccordion } from "@/components/pricing/PricingFaqAccordion";
import { PricingPlanCards } from "@/components/pricing/PricingPlanCards";
import { PricingSeoIntro } from "@/components/pricing/PricingSeoIntro";
import { StudioBundleCta } from "@/components/pricing/StudioBundleCta";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MarketingDarkHero } from "@/components/marketing/MarketingDarkHero";
import { ProductTransparencySection } from "@/components/marketing/ProductTransparencySection";
import { Container } from "@/components/ui/Container";
import { pricingPageFaqItems } from "@/lib/marketing/site-faq";
import { localeAlternates } from "@/lib/i18n/metadata";
import { clampMetaDescription, clampSeoTitle } from "@/lib/seo/meta";
import { MainContent } from "@/components/layout/MainContent";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

export const revalidate = 3600;

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    title: clampSeoTitle(t("pricingTitle")),
    description: clampMetaDescription(t("pricingDescription")),
    alternates: localeAlternates("/pricing"),
  };
}

export default async function PricingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pricingPage");

  return (
    <>
      <Header light overlay />
      <MainContent className="bg-background">
        <MarketingDarkHero
          eyebrow={t("eyebrow")}
          title={t("title")}
          description={t("description")}
        />

        <Container className="py-14 md:py-20 lg:py-24">
          <section
            className="mx-auto max-w-5xl"
            aria-labelledby="pricing-overview"
          >
            <h2
              id="pricing-overview"
              className="font-display text-center text-xl font-bold text-foreground dark:text-white md:text-2xl"
            >
              {t("overviewTitle")}
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent dark:text-glow">
                  {t("freeLabel")}
                </p>
                <p className="mt-2 font-semibold text-foreground dark:text-white">
                  {t("freeTitle")}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted dark:text-white/55">
                  {t("freeBody")}
                </p>
              </div>

              <div className="rounded-2xl border border-accent/30 bg-accent/5 p-5 shadow-sm dark:bg-[linear-gradient(180deg,rgba(14,165,233,0.12),rgba(255,255,255,0.04))] dark:shadow-[0_0_40px_rgba(14,165,233,0.08)]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent dark:text-glow">
                  {t("pilotLabel")}
                </p>
                <p className="mt-2 font-semibold text-foreground dark:text-white">
                  {t("pilotTitle")}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted dark:text-white/55">
                  {t("pilotBody")}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent dark:text-glow">
                  {t("fleetLabel")}
                </p>
                <p className="mt-2 font-semibold text-foreground dark:text-white">
                  {t("fleetTitle")}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted dark:text-white/55">
                  {t("fleetBody")}
                </p>
              </div>
            </div>
            <p className="mx-auto mt-6 max-w-3xl text-center text-sm leading-relaxed text-muted dark:text-white/45">
              {t("allPlansInclude")}
            </p>
          </section>

          <StudioBundleCta />

          <section
            className="mx-auto mt-14 max-w-3xl md:mt-16"
            aria-labelledby="pricing-faq"
          >
            <h2
              id="pricing-faq"
              className="font-display text-center text-xl font-bold text-foreground dark:text-white md:text-2xl"
            >
              {t("faqTitle")}
            </h2>
            <div className="mt-8">
              <PricingFaqAccordion items={pricingPageFaqItems()} />
            </div>
          </section>

          <section className="mt-14 md:mt-16" aria-labelledby="pricing-tiers">
            <h2
              id="pricing-tiers"
              className="font-display text-center text-xl font-bold text-foreground dark:text-white md:text-2xl"
            >
              {t("tiersTitle")}
            </h2>
            <ProductHuntPromoBar />
            <PricingPlanCards />
          </section>

          <ProductTransparencySection />

          <section
            className="mx-auto mt-14 max-w-3xl text-center"
            aria-labelledby="pricing-tools"
          >
            <h2
              id="pricing-tools"
              className="font-display text-xl font-bold text-foreground dark:text-white md:text-2xl"
            >
              {t("toolsTitle")}
            </h2>
            <p className="mt-3 text-sm text-muted dark:text-white/55">
              {t("toolsBody")}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/compare/semrush"
                className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground/80 transition hover:border-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 dark:border-white/15 dark:text-white/80"
              >
                {t("compareLink")}
              </Link>
              <Link
                href="/citation-checker"
                className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground/80 transition hover:border-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 dark:border-white/15 dark:text-white/80"
              >
                {t("citationChecker")}
              </Link>
              <Link
                href="/tools/citation-gap"
                className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground/80 transition hover:border-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 dark:border-white/15 dark:text-white/80"
              >
                {t("gapCalculator")}
              </Link>
              <Link
                href="/agency"
                className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground/80 transition hover:border-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 dark:border-white/15 dark:text-white/80"
              >
                {t("agencyFleet")}
              </Link>
            </div>
          </section>

          <div className="mt-14 text-foreground dark:text-white [&_h2]:text-foreground [&_h3]:text-foreground [&_p]:text-muted dark:[&_h2]:text-white dark:[&_h3]:text-white dark:[&_p]:text-white/60 [&_a]:text-accent dark:[&_a]:text-glow">
            <PricingSeoIntro />
          </div>
        </Container>
      </MainContent>
      <Footer />
    </>
  );
}
