import { HomePage } from "@/components/home/HomePage";
import { CancelledBanner } from "@/components/feedback/CancelledBanner";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { SiteJsonLd } from "@/components/marketing/SiteJsonLd";
import { FEATURE_FLAGS } from "@/lib/analytics/feature-flags";
import { getServerSideFlagVariant } from "@/lib/posthog-server";
import { MainContent } from "@/components/layout/MainContent";
import { Suspense } from "react";

export default async function Home() {
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
