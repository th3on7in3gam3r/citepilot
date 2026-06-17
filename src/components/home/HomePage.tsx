import dynamic from "next/dynamic";
import { CustomerLogosBar } from "@/components/home/CustomerLogosBar";
import { SocialProofStats } from "@/components/home/SocialProofStats";
import { FeatureSuite } from "@/components/home/FeatureSuite";
import { GeoPlaybookPromo } from "@/components/home/GeoPlaybookPromo";
import { Hero } from "@/components/home/Hero";
import { HomeActionBar } from "@/components/home/HomeActionBar";
import { HomeSectionSkeleton } from "@/components/home/HomeSectionSkeleton";
import { Pillars } from "@/components/home/Pillars";
import { AnswerCapsuleSection } from "@/components/home/AnswerCapsuleSection";
import { Testimonials } from "@/components/home/Testimonials";
import { BottomCTA } from "@/components/home/BottomCTA";
import { FAQ } from "@/components/home/FAQ";
import { FreeToolsSection } from "@/components/marketing/FreeToolsSection";
import { ProductTransparencySection } from "@/components/marketing/ProductTransparencySection";

const Differentiators = dynamic(
  () =>
    import("@/components/home/Differentiators").then((m) => ({
      default: m.Differentiators,
    })),
  {
    loading: () => <HomeSectionSkeleton variant="comparison" />,
  },
);

const ScrollBrandMarquee = dynamic(
  () =>
    import("@/components/home/ScrollBrandMarquee").then((m) => ({
      default: m.ScrollBrandMarquee,
    })),
  {
    loading: () => <HomeSectionSkeleton variant="marquee" />,
  },
);

const StickyProductShowcase = dynamic(
  () =>
    import("@/components/home/StickyProductShowcase").then((m) => ({
      default: m.StickyProductShowcase,
    })),
  {
    loading: () => <HomeSectionSkeleton variant="showcase" dark />,
  },
);

/** Home sections — hero + features eager; heavy below-fold sections lazy-loaded. */
export function HomePage({ heroCtaVariant }: { heroCtaVariant?: string }) {
  return (
    <>
      <Hero heroCtaVariant={heroCtaVariant} />
      <CustomerLogosBar />
      <SocialProofStats />
      <HomeActionBar />
      <FreeToolsSection />
      <FeatureSuite />
      <GeoPlaybookPromo />
      <ScrollBrandMarquee />
      <StickyProductShowcase />
      <Pillars />
      <Differentiators />
      <AnswerCapsuleSection />
      <Testimonials />
      <ProductTransparencySection />
      <BottomCTA />
      <FAQ />
    </>
  );
}
