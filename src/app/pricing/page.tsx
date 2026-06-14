import Link from "next/link";
import { PricingPlanCards } from "@/components/pricing/PricingPlanCards";
import { PricingSeoIntro } from "@/components/pricing/PricingSeoIntro";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MarketingDarkHero } from "@/components/marketing/MarketingDarkHero";
import { ProductTransparencySection } from "@/components/marketing/ProductTransparencySection";
import { Container } from "@/components/ui/Container";
import { pricingFaqs, pricingLanding } from "@/lib/marketing/pricing-landing";
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
      <main className="bg-[#04060c]">
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
              className="font-display text-center text-xl font-bold text-white md:text-2xl"
            >
              Plan comparison at a glance
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-glow">
                  Free
                </p>
                <p className="mt-2 font-semibold text-white">
                  Start with 1 workspace
                </p>
                <p className="mt-2 text-sm leading-relaxed text-white/55">
                  Run a free citation audit with up to 10 money prompts, 8 AI
                  platforms, competitor mentions, and a shareable report link.
                </p>
              </div>

              <div className="rounded-2xl border border-accent/30 bg-[linear-gradient(180deg,rgba(14,165,233,0.12),rgba(255,255,255,0.04))] p-5 shadow-[0_0_40px_rgba(14,165,233,0.08)]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-glow">
                  Pilot
                </p>
                <p className="mt-2 font-semibold text-white">
                  Upgrade for 3 workspaces
                </p>
                <p className="mt-2 text-sm leading-relaxed text-white/55">
                  Add monitoring, weekly action plans, article generation, CMS
                  publishing, and email alerts when competitor movement matters.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-glow">
                  Fleet
                </p>
                <p className="mt-2 font-semibold text-white">
                  Scale to unlimited clients
                </p>
                <p className="mt-2 text-sm leading-relaxed text-white/55">
                  Built for agencies that need unlimited workspaces, white-label
                  reporting, API access, bulk imports, and priority support.
                </p>
              </div>
            </div>
          </section>

          <section
            className="mt-14 md:mt-16"
            aria-labelledby="pricing-tiers"
          >
            <h2
              id="pricing-tiers"
              className="font-display text-center text-xl font-bold text-white md:text-2xl"
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
              className="font-display text-xl font-bold text-white md:text-2xl"
            >
              Not sure where you stand?
            </h2>
            <p className="mt-3 text-sm text-white/55">
              Use free tools before you upgrade — then measure citation lift in
              Pilot.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/citation-checker"
                className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-accent/40"
              >
                Citation checker
              </Link>
              <Link
                href="/tools/citation-gap"
                className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-accent/40"
              >
                Citation gap calculator
              </Link>
              <Link
                href="/agency"
                className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-accent/40"
              >
                Agency & Fleet
              </Link>
            </div>
          </section>

          <div className="mt-14 text-white [&_h2]:text-white [&_h3]:text-white [&_p]:text-white/60 [&_a]:text-glow">
            <PricingSeoIntro />
          </div>

          <section
            className="mx-auto mt-14 max-w-3xl"
            aria-labelledby="pricing-faq"
          >
            <h2
              id="pricing-faq"
              className="font-display text-center text-xl font-bold text-white md:text-2xl"
            >
              Pricing FAQ
            </h2>
            <dl className="mt-8 space-y-4">
              {pricingFaqs.map((faq) => (
                <div
                  key={faq.q}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm"
                >
                  <dt className="font-display font-bold text-white">{faq.q}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-white/60">
                    {faq.a}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </Container>
      </main>
      <Footer />
    </>
  );
}
