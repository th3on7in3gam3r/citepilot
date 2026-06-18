"use client";

import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/ui/Container";
import {
  LaunchCtaLink,
  LaunchDemoCarousel,
} from "@/components/launch/LaunchDemoCarousel";
import { testimonials, testimonialAvatarStyle, testimonialInitials } from "@/lib/data/testimonials";
import {
  founderEmail,
  founderName,
  phLaunchUrl,
  PH_PROMO_CODE,
  PH_PROMO_LABEL,
} from "@/lib/launch/config";

const PH_TESTIMONIAL_AUTHORS = ["Marcus T.", "Priya N.", "Elena R."];

const FEATURES = [
  {
    icon: "✓",
    title: "See where you're cited",
    body: "ChatGPT, Perplexity, Gemini, Google AI, Grok, DeepSeek — one scan shows all.",
  },
  {
    icon: "✓",
    title: "Know what to fix",
    body: "Weekly ranked action plan: schema gaps, answer capsules, content gaps. Not another vague score.",
  },
  {
    icon: "✓",
    title: "Prove the lift",
    body: "Re-scan after fixes. Show citation rate change per prompt. Shareable proof report.",
  },
] as const;

export function LaunchPageContent() {
  const phTestimonials = testimonials.filter((t) =>
    PH_TESTIMONIAL_AUTHORS.includes(t.author),
  );

  const startFreeHref = phLaunchUrl("/start");
  const claimOfferHref = phLaunchUrl("/start", { promo: PH_PROMO_CODE });
  const auditHref = phLaunchUrl("/audit");

  return (
    <>
      <Header light overlay />
      <main id="main-content" className="bg-cream">
        <section className="hero-premium relative overflow-hidden border-b border-border">
          <div className="hero-premium-orb hero-premium-orb--cyan" aria-hidden />
          <Container className="relative z-10 py-16 text-center md:py-24">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">
              Product Hunt launch
            </p>
            <h1 className="font-display mx-auto mt-4 max-w-3xl text-4xl font-bold tracking-tight text-ink md:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
              Finally know if ChatGPT cites your brand
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted md:text-lg">
              CitePilot tracks your citations across 6 AI platforms and tells you exactly what to
              fix — weekly.
            </p>

            <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-amber-300/60 bg-gradient-to-br from-amber-50 to-amber-100/80 px-5 py-4 text-left shadow-sm">
              <p className="text-sm font-semibold text-amber-950">
                🎉 Product Hunt exclusive — {PH_PROMO_LABEL}
              </p>
              <p className="mt-1 text-xs text-amber-900/80">
                Promo code:{" "}
                <code className="rounded bg-white/70 px-2 py-0.5 font-bold">{PH_PROMO_CODE}</code>{" "}
                · First 30 signups
              </p>
              <LaunchCtaLink
                href={claimOfferHref}
                ctaId="hero_claim_offer"
                className="mt-4 inline-flex rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-ink/90"
              >
                Claim offer →
              </LaunchCtaLink>
            </div>

            <p className="mt-8 text-sm text-muted">
              Tracked by 500+ teams · 6 AI platforms · Citation proof in 60 seconds
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <LaunchCtaLink
                href={auditHref}
                ctaId="hero_free_audit"
                className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent-deep"
              >
                Start free audit
              </LaunchCtaLink>
              <LaunchCtaLink
                href={startFreeHref}
                ctaId="hero_signup"
                className="rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-ink hover:bg-surface"
              >
                Create account
              </LaunchCtaLink>
            </div>
          </Container>
        </section>

        <Container className="py-16 md:py-20">
          <div className="mb-8 text-center">
            <h2 className="font-display text-2xl font-bold text-ink md:text-3xl">
              See CitePilot in action
            </h2>
            <p className="mt-2 text-muted">The views agencies screenshot for client reports.</p>
          </div>
          <LaunchDemoCarousel />
        </Container>

        <section className="border-y border-border bg-surface/50 py-16">
          <Container>
            <h2 className="font-display text-center text-2xl font-bold text-ink">
              What CitePilot does
            </h2>
            <ul className="mt-10 grid gap-6 md:grid-cols-3">
              {FEATURES.map((f) => (
                <li
                  key={f.title}
                  className="rounded-2xl border border-border bg-card p-6 shadow-sm"
                >
                  <span className="text-2xl text-mint" aria-hidden>
                    {f.icon}
                  </span>
                  <h3 className="mt-3 font-semibold text-ink">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
                </li>
              ))}
            </ul>
          </Container>
        </section>

        <Container className="py-16 md:py-20">
          <h2 className="font-display text-center text-2xl font-bold text-ink">
            Trusted by growth teams
          </h2>
          <ul className="mt-10 grid gap-6 md:grid-cols-3">
            {phTestimonials.map((t) => (
              <li
                key={t.author}
                className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={testimonialAvatarStyle(t.author)}
                  >
                    {testimonialInitials(t.author)}
                  </span>
                  <div>
                    <p className="font-semibold text-ink">{t.author}</p>
                    <p className="text-xs text-muted">
                      {t.role}, {t.company}
                    </p>
                  </div>
                </div>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-ink">&ldquo;{t.text}&rdquo;</p>
              </li>
            ))}
          </ul>
        </Container>

        <section className="border-t border-border bg-card py-14">
          <Container className="max-w-2xl text-center">
            <p className="text-sm leading-relaxed text-muted">
              <span className="font-semibold text-ink">{founderName()}</span> here — I built
              CitePilot because I was tired of guessing. Our team kept asking &ldquo;does ChatGPT
              even mention us?&rdquo; with no way to find out. This is the tool I wish existed.
            </p>
          </Container>
        </section>

        <section className="border-t border-border bg-ink py-16 text-white">
          <Container className="text-center">
            <h2 className="font-display text-2xl font-bold md:text-3xl">
              Start tracking AI citations today
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-white/70">
              Free audit — no credit card. Product Hunt visitors get {PH_PROMO_LABEL.toLowerCase()}.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <LaunchCtaLink
                href={auditHref}
                ctaId="footer_free_audit"
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink hover:bg-white/90"
              >
                Start free audit — no credit card
              </LaunchCtaLink>
              <LaunchCtaLink
                href={claimOfferHref}
                ctaId="footer_claim_offer"
                className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                Claim 30% off Pilot
              </LaunchCtaLink>
            </div>
            <p className="mt-8 text-sm text-white/60">
              Questions? Reach me directly:{" "}
              <a href={`mailto:${founderEmail()}`} className="font-semibold text-white underline">
                {founderEmail()}
              </a>
            </p>
            <p className="mt-4 text-xs text-white/40">
              Not on Product Hunt?{" "}
              <Link href="/" className="underline hover:text-white/70">
                Back to homepage
              </Link>
            </p>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
