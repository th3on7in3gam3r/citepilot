import { Suspense } from "react";
import { AuditDiagnosticExplorer } from "@/components/audit/AuditDiagnosticExplorer";
import { AuditForm } from "@/components/audit/AuditForm";
import { AuditSeoIntro } from "@/components/audit/AuditSeoIntro";
import { ProductTransparencySection } from "@/components/marketing/ProductTransparencySection";
import { Container } from "@/components/ui/Container";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { auditLanding, auditLandingFaqs } from "@/lib/marketing/audit-landing";
import { clampMetaDescription, clampSeoTitle } from "@/lib/seo/meta";
import { site } from "@/lib/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: clampSeoTitle(auditLanding.shortTitle),
  description: clampMetaDescription(auditLanding.description),
  alternates: { canonical: `${site.url}${auditLanding.path}` },
  openGraph: {
    title: auditLanding.title,
    description: clampMetaDescription(auditLanding.description),
    url: auditLanding.path,
    type: "website",
  },
  twitter: {
    title: auditLanding.shortTitle,
    description: clampMetaDescription(auditLanding.description),
  },
};

function AuditFormFallback() {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="h-96 animate-pulse rounded-2xl bg-white/60" />
      <div className="h-96 animate-pulse rounded-2xl bg-white/60" />
    </div>
  );
}

export default function AuditPage() {
  return (
    <>
      <Header />
      <main className="bg-[#04060c] pt-16 md:pt-[4.5rem]">
        {/* Hero — dark cinematic matching brand */}
        <div className="relative overflow-hidden border-b border-white/[0.06]">
          {/* Glow orbs */}
          <div className="hero-premium-orb hero-premium-orb--cyan" aria-hidden />
          <div
            className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[rgba(16,185,129,0.08)] blur-[80px]"
            aria-hidden
          />
          <div className="hero-premium-grid" aria-hidden />

          <Container className="relative z-10 py-16 text-center md:py-20 lg:py-24">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-semibold text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
              Free tool · ~60 seconds
            </div>
            <h1 className="font-display mx-auto mt-5 max-w-3xl text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
              {auditLanding.title}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/60 md:text-lg">
              {auditLanding.description}
            </p>

            {/* Trust signals */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/35">
              <span className="flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5 text-mint" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                No account required
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5 text-mint" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                ChatGPT, Perplexity, Gemini &amp; more
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5 text-mint" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                No credit card
              </span>
            </div>
          </Container>
        </div>

        {/* Body — light background for form readability */}
        <div className="bg-cream">
          <Container className="py-12 md:py-16 lg:py-20">

            {/* Diagnostic explorer */}
            <div className="mx-auto max-w-4xl">
              <AuditDiagnosticExplorer />
            </div>

            {/* Audit form */}
            <div className="mt-10 md:mt-12">
              <Suspense fallback={<AuditFormFallback />}>
                <AuditForm />
              </Suspense>
            </div>

            {/* SEO intro */}
            <AuditSeoIntro />

            {/* FAQ */}
            <section className="mx-auto mt-14 max-w-3xl" aria-labelledby="audit-faq">
              <h2
                id="audit-faq"
                className="font-display text-center text-xl font-bold text-ink"
              >
                Citation audit FAQ
              </h2>
              <dl className="mt-8 space-y-3">
                {auditLandingFaqs.map((faq) => (
                  <details
                    key={faq.q}
                    className="group rounded-2xl border border-border bg-white shadow-sm"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 select-none">
                      <dt className="font-display font-semibold text-ink">{faq.q}</dt>
                      <span className="shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden>▾</span>
                    </summary>
                    <dd className="px-6 pb-5 text-sm leading-relaxed text-muted border-t border-border/50 pt-4">
                      {faq.a}
                    </dd>
                  </details>
                ))}
              </dl>
            </section>

            {/* Bottom CTA */}
            <div className="mx-auto mt-16 max-w-2xl rounded-3xl border border-accent/30 bg-gradient-to-br from-accent/5 to-accent/[0.02] p-8 text-center md:p-10">
              <p className="text-xs font-semibold uppercase tracking-widest text-accent">Ready to track weekly?</p>
              <h2 className="font-display mt-3 text-2xl font-bold text-ink md:text-3xl">
                Turn your audit into a workspace
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
                Weekly rescans, Autopilot action plans, platform presence history, and stakeholder proof reports — all from your domain and prompts.
              </p>
              <a
                href="/start"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-accent-deep"
              >
                Start free analysis →
              </a>
              <p className="mt-3 text-xs text-muted">No credit card · Free tier available</p>
            </div>

          </Container>
        </div>

        <ProductTransparencySection variant="light" />
      </main>
      <Footer />
    </>
  );
}
