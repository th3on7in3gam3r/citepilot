import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { StatusPageClient } from "@/components/status/StatusPageClient";
import {
  fetchInternalHealth,
  hasCustomerOutage,
  mapHealthToPublicServices,
} from "@/lib/ops/health-status";
import { clampMetaDescription } from "@/lib/seo/meta";
import { Container } from "@/components/ui/Container";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "System Status",
  description: clampMetaDescription(
    "Live CitePilot service status for AI scans, database, email alerts, CMS publishing, and billing.",
  ),
  alternates: { canonical: `${site.url}/status` },
};

export default async function StatusPage() {
  const { payload, checkedAt } = await fetchInternalHealth();
  const services = mapHealthToPublicServices(payload);
  const initial = {
    checkedAt,
    services,
    degraded: hasCustomerOutage(services),
  };

  return (
    <>
      <Header light overlay />
      <main id="main-content" tabIndex={-1} className="hero-premium relative min-h-[70vh] text-white">
        <div className="hero-premium-grid" aria-hidden />
        <Container className="relative z-10 px-4 pt-28 pb-16 md:pt-32">
          <header className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-glow">
              System status
            </p>
            <h1 className="font-display mt-3 text-3xl font-bold md:text-4xl">
              CitePilot services
            </h1>
            <p className="mt-3 text-sm text-white/55 md:text-base">
              Real-time health for customer-facing systems. Refreshes every 60
              seconds.
            </p>
          </header>

          <div className="mx-auto mt-10 max-w-xl">
            <StatusPageClient initial={initial} />
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
