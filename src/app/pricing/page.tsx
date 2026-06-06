import { PricingTierActions } from "@/components/billing/PricingTierActions";
import { PricingSeoIntro } from "@/components/pricing/PricingSeoIntro";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { pricingTiers } from "@/lib/content";
import { pricingFaqs, pricingLanding } from "@/lib/marketing/pricing-landing";
import { clampMetaDescription, clampSeoTitle } from "@/lib/seo/meta";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: clampSeoTitle(pricingLanding.shortTitle),
  description: clampMetaDescription(pricingLanding.description),
  alternates: { canonical: pricingLanding.path },
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
      <Header />
      <main className="bg-cream pt-16 md:pt-[4.5rem]">
        <Container className="py-16 md:py-24 lg:py-28">
          <SectionHeading
            headingLevel="h1"
            eyebrow="Pricing"
            title="GEO and AI citation monitoring pricing"
            description="Start free. Scale when citations move. Free includes 1 workspace and a citation audit. Upgrade to Pilot for 3 workspaces plus monitoring, content generation, and CMS publish, or Fleet for unlimited client workspaces."
            align="center"
          />

          <section
            className="mx-auto mt-10 max-w-5xl"
            aria-labelledby="pricing-overview"
          >
            <h2
              id="pricing-overview"
              className="font-display text-center text-xl font-bold text-ink md:text-2xl"
            >
              Plan comparison at a glance
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                  Free
                </p>
                <p className="mt-2 font-semibold text-ink">
                  Start with 1 workspace
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Run a free citation audit with up to 10 money prompts, 8 AI
                  platforms, competitor mentions, and a shareable report link.
                </p>
              </div>

              <div className="rounded-2xl border border-accent/20 bg-[linear-gradient(180deg,rgba(123,147,240,0.08),rgba(255,255,255,0.98))] p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                  Pilot
                </p>
                <p className="mt-2 font-semibold text-ink">
                  Upgrade for 3 workspaces
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Add monitoring, weekly action plans, article generation, CMS
                  publishing, and email alerts when competitor movement matters.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                  Fleet
                </p>
                <p className="mt-2 font-semibold text-ink">
                  Scale to unlimited clients
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted">
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
              className="font-display text-center text-xl font-bold text-ink md:text-2xl"
            >
              Choose your plan
            </h2>
            <div className="mt-10 grid gap-8 lg:grid-cols-3 lg:gap-6">
              {pricingTiers.map((tier) => (
                <article
                  key={tier.name}
                  className={`flex flex-col rounded-2xl border p-8 md:p-10 ${
                    tier.highlighted
                      ? "border-accent bg-ink text-white shadow-xl shadow-accent/20"
                      : "border-border bg-white"
                  }`}
                >
                  <h3
                    className={`font-display text-lg font-bold ${
                      tier.highlighted ? "text-white" : "text-ink"
                    }`}
                  >
                    {tier.name}
                  </h3>
                  <p className="mt-5 font-display text-4xl font-bold">
                    {tier.price}
                    <span
                      className={`text-base font-normal ${
                        tier.highlighted ? "text-white/60" : "text-muted"
                      }`}
                    >
                      {tier.period}
                    </span>
                  </p>
                  <p
                    className={`mt-3 text-sm leading-relaxed ${
                      tier.highlighted ? "text-white/65" : "text-muted"
                    }`}
                  >
                    {tier.description}
                  </p>
                  <ul className="mt-8 flex-1 space-y-4">
                    {tier.features.map((f) => (
                      <li
                        key={f}
                        className={`flex gap-3 text-sm leading-relaxed ${
                          tier.highlighted ? "text-white/80" : "text-muted"
                        }`}
                      >
                        <span className="shrink-0 text-accent">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-10 w-full">
                    <PricingTierActions
                      tierName={tier.name}
                      href={tier.href}
                      cta={tier.cta}
                      variant={
                        tier.highlighted
                          ? "dark"
                          : tier.name === "Audit"
                            ? "accent"
                            : "primary"
                      }
                    />
                  </div>
                </article>
              ))}
            </div>
          </section>

          <PricingSeoIntro />

          <section
            className="mx-auto mt-14 max-w-3xl"
            aria-labelledby="pricing-faq"
          >
            <h2
              id="pricing-faq"
              className="font-display text-center text-xl font-bold text-ink md:text-2xl"
            >
              Pricing FAQ
            </h2>
            <dl className="mt-8 space-y-4">
              {pricingFaqs.map((faq) => (
                <div
                  key={faq.q}
                  className="rounded-2xl border border-border bg-white p-6 shadow-sm"
                >
                  <dt className="font-display font-bold text-ink">{faq.q}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-muted">
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
