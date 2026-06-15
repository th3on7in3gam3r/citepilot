import { FreeToolsSection } from "@/components/marketing/FreeToolsSection";
import { CustomerLogosBar } from "@/components/home/CustomerLogosBar";
import { SocialProofStats } from "@/components/home/SocialProofStats";
import { FeatureSuite } from "@/components/home/FeatureSuite";
import { GeoPlaybookPromo } from "@/components/home/GeoPlaybookPromo";
import { Hero } from "@/components/home/Hero";
import { HomeActionBar } from "@/components/home/HomeActionBar";
import { ScrollBrandMarquee } from "@/components/home/ScrollBrandMarquee";
import { StickyProductShowcase } from "@/components/home/StickyProductShowcase";
import { Pillars } from "@/components/home/Pillars";
import { Differentiators } from "@/components/home/Differentiators";
import { AnswerCapsuleSection } from "@/components/home/AnswerCapsuleSection";
import { Testimonials } from "@/components/home/Testimonials";
import { BottomCTA } from "@/components/home/BottomCTA";
import { FAQ } from "@/components/home/FAQ";
import { ProductTransparencySection } from "@/components/marketing/ProductTransparencySection";

/** Home sections — ordered for narrative flow, no duplicate loops. */
export function HomePage() {
  return (
    <>
      <Hero />
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
