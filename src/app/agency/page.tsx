import Link from "next/link";
import { PricingTierActions } from "@/components/billing/PricingTierActions";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MarketingDarkHero } from "@/components/marketing/MarketingDarkHero";
import { Container } from "@/components/ui/Container";
import {
  agencyFaqs,
  agencyLanding,
  agencyUseCases,
} from "@/lib/marketing/agency-landing";
import { clampMetaDescription, clampSeoTitle } from "@/lib/seo/meta";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: clampSeoTitle(agencyLanding.shortTitle),
  description: clampMetaDescription(agencyLanding.description),
  alternates: { canonical: agencyLanding.path },
  openGraph: {
    title: agencyLanding.title,
    description: clampMetaDescription(agencyLanding.description),
    url: agencyLanding.path,
    type: "website",
  },
};

export default function AgencyPage() {
  return (
    <>
      <Header light overlay />
      <main className="bg-[#04060c]">
        <MarketingDarkHero
          eyebrow="Fleet · $249/mo"
          title="Run GEO audits for every client"
          description={agencyLanding.description}
        >
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/start?plan=fleet"
              className="inline-flex rounded-full bg-accent px-6 py-3 text-sm font-bold text-white"
            >
              Start Fleet trial
            </Link>
            <Link
              href="/docs/api"
              className="inline-flex rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white/80"
            >
              API docs
            </Link>
          </div>
        </MarketingDarkHero>

        <Container className="py-14 md:py-20">
          <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2">
            {agencyUseCases.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm"
              >
                <h2 className="font-display text-lg font-bold text-white">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-white/60">
                  {item.body}
                </p>
              </article>
            ))}
          </div>

          <div className="mx-auto mt-14 max-w-lg rounded-2xl border border-accent/30 bg-gradient-to-b from-accent/15 to-white/[0.04] p-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-glow">
              Fleet plan
            </p>
            <p className="font-display mt-2 text-4xl font-bold text-white">
              $249
              <span className="text-base font-normal text-white/50">/mo</span>
            </p>
            <p className="mt-3 text-sm text-white/60">
              Unlimited client workspaces · white-label · Fleet API · bulk import
            </p>
            <div className="mt-6">
              <PricingTierActions
                tierName="Fleet"
                href="/start?plan=fleet"
                cta="Get Fleet"
                variant="dark"
              />
            </div>
          </div>

          <section className="mx-auto mt-14 max-w-3xl" aria-labelledby="agency-faq">
            <h2
              id="agency-faq"
              className="font-display text-center text-xl font-bold text-white"
            >
              Agency FAQ
            </h2>
            <dl className="mt-8 space-y-4">
              {agencyFaqs.map((faq) => (
                <div
                  key={faq.q}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-6"
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
