import Link from "next/link";
import { PricingFaqAccordion } from "@/components/pricing/PricingFaqAccordion";
import { PricingPlanCards } from "@/components/pricing/PricingPlanCards";
import { PricingSeoIntro } from "@/components/pricing/PricingSeoIntro";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MarketingDarkHero } from "@/components/marketing/MarketingDarkHero";
import { ProductTransparencySection } from "@/components/marketing/ProductTransparencySection";
import { Container } from "@/components/ui/Container";
import { pricingLanding } from "@/lib/marketing/pricing-landing";
import { pricingPageFaqItems } from "@/lib/marketing/site-faq";
import { clampMetaDescription, clampSeoTitle } from "@/lib/seo/meta";
import { site } from "@/lib/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: clampSeoTitle(pricingLanding.shortTitle),
  description: clampMetaDescription(pricingLanding.description),
  alternates: { canonical: `${site.url}${pricingLanding.path}` },
  openGraph: {
    title: pricingLanding.title,
    description: clampMetaDescription(pricingLanding.description),
    url: pricingLanding.path,
    type: "website",
  },
  twitter: {
    title: pricingLanding.shortTitle,
    description: clampMetaDescription(pricingLanding.description),
  },
};

export default function PricingPage() {
  return (
    <>
      <Header light overlay />
      <main className="bg-background">
        <MarketingDarkHero
          eyebrow="Pricing"
          title="GEO and AI citation monitoring pricing"
          description="Start free. Scale when citations move. Free includes 1 workspace and a citation audit. Upgrade to Pilot for 3 workspaces plus monitoring, content generation, and CMS publish, or Fleet for unlimited client workspaces."
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
              Plan comparison at a glance
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent dark:text-glow">
                  Free
                </p>
                <p className="mt-2 font-semibold text-foreground dark:text-white">
                  Start with 1 workspace
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted dark:text-white/55">
                  Run a free citation audit with up to 10 money prompts, 8 AI
                  platforms, competitor mentions, and a shareable report link.
                </p>
              </div>

              <div className="rounded-2xl border border-accent/30 bg-accent/5 p-5 shadow-sm dark:bg-[linear-gradient(180deg,rgba(14,165,233,0.12),rgba(255,255,255,0.04))] dark:shadow-[0_0_40px_rgba(14,165,233,0.08)]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent dark:text-glow">
                  Pilot
                </p>
                <p className="mt-2 font-semibold text-foreground dark:text-white">
                  Upgrade for 3 workspaces
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted dark:text-white/55">
                  Add monitoring, weekly action plans, article generation, CMS
                  publishing, and email alerts when competitor movement matters.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent dark:text-glow">
                  Fleet
                </p>
                <p className="mt-2 font-semibold text-foreground dark:text-white">
                  Scale to unlimited clients
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted dark:text-white/55">
                  Built for agencies that need unlimited workspaces, white-label
                  reporting, API access, bulk imports, and priority support.
                </p>
              </div>
            </div>
            <p className="mx-auto mt-6 max-w-3xl text-center text-sm leading-relaxed text-muted dark:text-white/45">
              All plans include: HTTPS, Vercel edge hosting, SOC2-grade
              infrastructure via Neon and Vercel, and email support.
            </p>
          </section>

          <section
            className="mx-auto mt-14 max-w-3xl md:mt-16"
            aria-labelledby="pricing-faq"
          >
            <h2
              id="pricing-faq"
              className="font-display text-center text-xl font-bold text-foreground dark:text-white md:text-2xl"
            >
              Frequently asked questions
            </h2>
            <div className="mt-8">
              <PricingFaqAccordion items={pricingPageFaqItems()} />
            </div>
          </section>

          <section
            className="mt-14 md:mt-16"
            aria-labelledby="pricing-tiers"
          >
            <h2
              id="pricing-tiers"
              className="font-display text-center text-xl font-bold text-foreground dark:text-white md:text-2xl"
            >
              Choose your plan
            </h2>
            <PricingPlanCards />
          </section>

          <ProductTransparencySection variant="dark" />

          <section
            className="mx-auto mt-14 max-w-3xl text-center"
            aria-labelledby="pricing-tools"
          >
            <h2
              id="pricing-tools"
              className="font-display text-xl font-bold text-foreground dark:text-white md:text-2xl"
            >
              Not sure where you stand?
            </h2>
            <p className="mt-3 text-sm text-muted dark:text-white/55">
              Use free tools before you upgrade — then measure citation lift in
              Pilot.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/compare/semrush"
                className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground/80 transition hover:border-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 dark:border-white/15 dark:text-white/80"
              >
                See how CitePilot compares to legacy SEO tools →
              </Link>
              <Link
                href="/citation-checker"
                className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground/80 transition hover:border-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 dark:border-white/15 dark:text-white/80"
              >
                Citation checker
              </Link>
              <Link
                href="/tools/citation-gap"
                className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground/80 transition hover:border-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 dark:border-white/15 dark:text-white/80"
              >
                Citation gap calculator
              </Link>
              <Link
                href="/agency"
                className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground/80 transition hover:border-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 dark:border-white/15 dark:text-white/80"
              >
                Agency & Fleet
              </Link>
            </div>
          </section>

          <div className="mt-14 text-foreground dark:text-white [&_h2]:text-foreground [&_h3]:text-foreground [&_p]:text-muted dark:[&_h2]:text-white dark:[&_h3]:text-white dark:[&_p]:text-white/60 [&_a]:text-accent dark:[&_a]:text-glow">
            <PricingSeoIntro />
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
