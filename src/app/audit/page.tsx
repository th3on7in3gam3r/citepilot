import { Suspense } from "react";
import { AuditDiagnosticExplorer } from "@/components/audit/AuditDiagnosticExplorer";
import { AuditForm } from "@/components/audit/AuditForm";
import { AuditSeoIntro } from "@/components/audit/AuditSeoIntro";
import { Container } from "@/components/ui/Container";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { auditLanding, auditLandingFaqs } from "@/lib/marketing/audit-landing";
import { clampMetaDescription, clampSeoTitle } from "@/lib/seo/meta";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: clampSeoTitle(auditLanding.shortTitle),
  description: clampMetaDescription(auditLanding.description),
  alternates: { canonical: auditLanding.path },
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
      <div className="h-96 animate-pulse rounded-2xl bg-white" />
      <div className="h-96 animate-pulse rounded-2xl bg-white" />
    </div>
  );
}

export default function AuditPage() {
  return (
    <>
      <Header />
      <main className="bg-cream pt-16 md:pt-[4.5rem]">
        <Container className="py-12 md:py-16 lg:py-20">
          <header className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">
              Free tool · ~60 seconds
            </p>
            <h1 className="font-display mt-4 text-4xl font-bold tracking-tight text-ink md:text-5xl">
              {auditLanding.title}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted">
              {auditLanding.description}
            </p>
          </header>

          <div className="mx-auto mt-12 max-w-4xl">
            <AuditDiagnosticExplorer />
          </div>

          <div className="mt-14 md:mt-16">
            <Suspense fallback={<AuditFormFallback />}>
              <AuditForm />
            </Suspense>
          </div>

          <AuditSeoIntro />

          <section className="mx-auto mt-14 max-w-3xl" aria-labelledby="audit-faq">
            <h2
              id="audit-faq"
              className="font-display text-center text-xl font-bold text-ink"
            >
              Citation audit FAQ
            </h2>
            <dl className="mt-8 space-y-4">
              {auditLandingFaqs.map((faq) => (
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
