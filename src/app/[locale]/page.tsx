import { HomePage } from "@/components/home/HomePage";
import { CancelledBanner } from "@/components/feedback/CancelledBanner";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { SiteJsonLd } from "@/components/marketing/SiteJsonLd";
import { FEATURE_FLAGS } from "@/lib/analytics/feature-flags";
import { getServerSideFlagVariant } from "@/lib/posthog-server";
import { MainContent } from "@/components/layout/MainContent";
import { localeAlternates } from "@/lib/i18n/metadata";
import { clampMetaDescription } from "@/lib/seo/meta";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    title: t("homeTitle"),
    description: clampMetaDescription(t("homeDescription")),
    alternates: localeAlternates("/"),
    openGraph: {
      locale: locale === "es" ? "es_ES" : locale === "fr" ? "fr_FR" : "en_US",
    },
  };
}

export default async function Home({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const heroCtaVariant = await getServerSideFlagVariant(FEATURE_FLAGS.HERO_CTA_TEXT);

  return (
    <>
      <SiteJsonLd />
      <Suspense fallback={null}>
        <CancelledBanner />
      </Suspense>
      <Header light overlay />
      <MainContent>
        <HomePage heroCtaVariant={heroCtaVariant} />
      </MainContent>
      <Footer />
    </>
  );
}
