import { Suspense } from "react";
import { AuditForm } from "@/components/audit/AuditForm";
import { Container } from "@/components/ui/Container";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Citation Audit",
  description:
    "See where your brand is cited across ChatGPT, Perplexity, Google AI, and more — in about 60 seconds.",
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
        <Container className="py-16 md:py-24 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">
              Free tool
            </p>
            <h1 className="font-display mt-4 text-4xl font-bold tracking-tight text-ink md:text-5xl">
              Citation audit
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted">
              Baseline your money prompts before you spend another month on
              content that AI never cites.
            </p>
          </div>
          <div className="mt-14 md:mt-16">
            <Suspense fallback={<AuditFormFallback />}>
              <AuditForm />
            </Suspense>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
