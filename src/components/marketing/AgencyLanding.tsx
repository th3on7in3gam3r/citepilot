import Link from "next/link";
import { PricingTierActions } from "@/components/billing/PricingTierActions";
import { MarketingDarkHero } from "@/components/marketing/MarketingDarkHero";
import { TestimonialAvatar } from "@/components/ui/TestimonialAvatar";
import { Container } from "@/components/ui/Container";
import { testimonials } from "@/lib/data/testimonials";
import {
  agencyFooterCta,
  agencyLanding,
  agencyPricing,
  agencyTestimonialAuthors,
} from "@/lib/marketing/agency-landing";
import { getTranslations } from "next-intl/server";

function FeatureIcon({ type }: { type: string }) {
  const cls = "h-6 w-6 text-accent";
  switch (type) {
    case "workspaces":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75A2.25 2.25 0 0115.75 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25h-2.25A2.25 2.25 0 0113.5 18v-2.25zM13.5 6A2.25 2.25 0 0115.75 3.75h2.25A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25A2.25 2.25 0 0113.5 8.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 018.25 20.25H6A2.25 2.25 0 013.75 18v-2.25z" />
        </svg>
      );
    case "whitelabel":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
        </svg>
      );
    case "csv":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      );
    case "api":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
        </svg>
      );
    default:
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      );
  }
}

function AgencyTestimonialCard({
  review,
}: {
  review: (typeof testimonials)[number];
}) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-sm">
      <div className="flex gap-1 text-amber-400">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg key={i} className="h-4 w-4 fill-current" viewBox="0 0 20 20" aria-hidden>
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <p className="mt-6 flex-1 text-lg leading-relaxed text-white/85">
        &ldquo;{review.text}&rdquo;
      </p>
      <footer className="mt-8 flex items-center gap-4 border-t border-white/10 pt-6">
        <TestimonialAvatar author={review.author} />
        <div>
          <p className="font-semibold text-white">{review.author}</p>
          <p className="text-sm text-accent">{review.company}</p>
          <p className="text-sm text-white/50">{review.role}</p>
        </div>
      </footer>
    </article>
  );
}

export async function AgencyLanding() {
  const t = await getTranslations("agency");
  const featuredTestimonials = testimonials.filter((item) =>
    (agencyTestimonialAuthors as readonly string[]).includes(item.author),
  );

  const painPoints = [t("problem0"), t("problem1"), t("problem2")];
  const fleetFeatures = [
    { icon: "workspaces", title: t("featureWorkspacesTitle"), body: t("featureWorkspacesBody") },
    { icon: "whitelabel", title: t("featureWhitelabelTitle"), body: t("featureWhitelabelBody") },
    { icon: "csv", title: t("featureCsvTitle"), body: t("featureCsvBody") },
    { icon: "api", title: t("featureApiTitle"), body: t("featureApiBody") },
    { icon: "support", title: t("featureSupportTitle"), body: t("featureSupportBody") },
  ];
  const workflow = [
    { step: 1, title: t("workflow1Title"), body: t("workflow1Body") },
    { step: 2, title: t("workflow2Title"), body: t("workflow2Body") },
    { step: 3, title: t("workflow3Title"), body: t("workflow3Body") },
  ];
  const pricingFeatures = [
    t("pricingFeature0"),
    t("pricingFeature1"),
    t("pricingFeature2"),
    t("pricingFeature3"),
    t("pricingFeature4"),
  ];
  const faqs = [
    { q: t("faq0q"), a: t("faq0a") },
    { q: t("faq1q"), a: t("faq1a") },
    { q: t("faq2q"), a: t("faq2a") },
    { q: t("faq3q"), a: t("faq3a") },
    { q: t("faq4q"), a: t("faq4a") },
  ];

  return (
    <>
      <MarketingDarkHero
        eyebrow={t("heroEyebrow")}
        title={t("heroTitle")}
        description={t("heroDescription")}
      >
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href={agencyLanding.hero.ctaHref}
            className="inline-flex rounded-full bg-accent px-7 py-3.5 text-sm font-bold text-white shadow-[0_0_32px_rgba(14,165,233,0.35)] transition hover:bg-accent-deep"
          >
            {t("heroCta")}
          </Link>
          <Link
            href="/docs/api"
            className="inline-flex rounded-full border border-white/20 px-7 py-3.5 text-sm font-semibold text-white/80 transition hover:border-white/40 hover:text-white"
          >
            {t("heroApiDocs")}
          </Link>
        </div>
      </MarketingDarkHero>

      <Container className="py-16 md:py-24">
        <section className="mx-auto max-w-3xl text-center" aria-labelledby="agency-problem">
          <h2
            id="agency-problem"
            className="font-display text-2xl font-bold text-white md:text-3xl lg:text-4xl"
          >
            {t("problemTitle")}
          </h2>
          <ul className="mt-10 space-y-4 text-left">
            {painPoints.map((item) => (
              <li
                key={item}
                className="flex gap-4 rounded-2xl border border-red-500/20 bg-red-500/[0.06] px-5 py-4 text-sm leading-relaxed text-white/75 md:text-base"
              >
                <span className="mt-0.5 shrink-0 text-red-400" aria-hidden>
                  ✕
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Fleet features */}
        <section
          className="mx-auto mt-20 max-w-5xl md:mt-28"
          aria-labelledby="agency-features"
        >
          <h2
            id="agency-features"
            className="font-display text-center text-2xl font-bold text-white md:text-3xl"
          >
            {t("featuresTitle")}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-white/55 md:text-base">
            {t("featuresSub")}
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {fleetFeatures.map((feature) => (
              <article
                key={feature.title}
                className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-accent/25 bg-accent/10">
                  <FeatureIcon type={feature.icon} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-white">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">{feature.body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Workflow */}
        <section
          className="mx-auto mt-20 max-w-4xl md:mt-28"
          aria-labelledby="agency-workflow"
        >
          <h2
            id="agency-workflow"
            className="font-display text-center text-2xl font-bold text-white md:text-3xl"
          >
            {t("workflowTitle")}
          </h2>
          <ol className="mt-12 space-y-6">
            {workflow.map((step) => (
              <li
                key={step.step}
                className="flex gap-5 rounded-2xl border border-white/10 bg-gradient-to-r from-accent/10 to-transparent p-6 md:gap-8 md:p-8"
              >
                <span className="font-display flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-lg font-bold text-white">
                  {step.step}
                </span>
                <div>
                  <h3 className="font-display text-lg font-bold text-white md:text-xl">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/60 md:text-base">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Testimonials */}
        <section
          className="mx-auto mt-20 max-w-4xl md:mt-28"
          aria-labelledby="agency-testimonials"
        >
          <h2
            id="agency-testimonials"
            className="font-display text-center text-2xl font-bold text-white md:text-3xl"
          >
            {t("testimonialsTitle")}
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {featuredTestimonials.map((review) => (
              <AgencyTestimonialCard key={review.author} review={review} />
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section
          className="mx-auto mt-20 max-w-lg md:mt-28"
          aria-labelledby="agency-pricing"
        >
          <div className="rounded-2xl border border-accent/35 bg-gradient-to-b from-accent/20 to-white/[0.04] p-8 text-center shadow-[0_0_48px_rgba(14,165,233,0.12)] md:p-10">
            <p
              id="agency-pricing"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-glow"
            >
              {t("pricingLabel")}
            </p>
            <p className="font-display mt-3 text-5xl font-bold text-white">
              {agencyPricing.price}
              <span className="text-lg font-normal text-white/50">
                {agencyPricing.interval}
              </span>
            </p>
            <p className="mt-4 text-sm leading-relaxed text-white/65 md:text-base">
              {t("pricingTagline")}
            </p>
            <ul className="mt-6 space-y-2 text-left text-sm text-white/55">
              {pricingFeatures.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <div className="mt-8">
              <PricingTierActions
                tierName="Fleet"
                href={agencyPricing.href}
                cta={t("pricingCta")}
                variant="dark"
              />
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section
          className="mx-auto mt-20 max-w-3xl md:mt-28"
          aria-labelledby="agency-faq"
        >
          <h2
            id="agency-faq"
            className="font-display text-center text-2xl font-bold text-white md:text-3xl"
          >
            {t("faqTitle")}
          </h2>
          <dl className="mt-10 space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.q}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm"
              >
                <dt className="font-display font-bold text-white">{faq.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-white/60">{faq.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Footer CTA */}
        <section
          className="mx-auto mt-20 max-w-3xl text-center md:mt-28"
          aria-labelledby="agency-cta"
        >
          <h2
            id="agency-cta"
            className="font-display text-2xl font-bold text-white md:text-3xl"
          >
            {t("footerCtaTitle")}
          </h2>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={agencyFooterCta.primary.href}
              className="inline-flex w-full rounded-full bg-accent px-8 py-3.5 text-sm font-bold text-white sm:w-auto"
            >
              {t("footerCtaPrimary")}
            </Link>
            <Link
              href={agencyFooterCta.secondary.href}
              className="inline-flex w-full rounded-full border border-white/25 px-8 py-3.5 text-sm font-semibold text-white/85 transition hover:border-white/50 sm:w-auto"
            >
              {t("footerCtaSecondary")}
            </Link>
          </div>
        </section>
      </Container>
    </>
  );
}
