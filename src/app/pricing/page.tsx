import { PricingTierActions } from "@/components/billing/PricingTierActions";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { pricingTiers } from "@/lib/content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Start free with a citation audit. Scale with Pilot or Fleet when monitoring launches.",
};

export default function PricingPage() {
  return (
    <>
      <Header />
      <main className="bg-cream pt-16 md:pt-[4.5rem]">
        <Container className="py-16 md:py-24 lg:py-28">
          <SectionHeading
            eyebrow="Pricing"
            title="Start free. Scale when citations move."
            description="Audit is live today. Subscribe to Pilot for monitoring, content generation, and CMS publish."
            align="center"
          />

          <div className="mt-14 grid gap-8 md:mt-16 lg:grid-cols-3 lg:gap-6">
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
        </Container>
      </main>
      <Footer />
    </>
  );
}
