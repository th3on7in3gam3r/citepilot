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

/** Home sections — ordered for narrative flow, no duplicate loops. */
export function HomePage() {
  return (
    <>
      <Hero />
      <HomeActionBar />
      <FeatureSuite />
      <GeoPlaybookPromo />
      <ScrollBrandMarquee />
      <StickyProductShowcase />
      <Pillars />
      <Differentiators />
      <AnswerCapsuleSection />
      <Testimonials />
      <BottomCTA />
      <FAQ />
    </>
  );
}
