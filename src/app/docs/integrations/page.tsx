import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/ui/Container";
import { site } from "@/lib/site";
import type { Metadata } from "next";
import Link from "next/link";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Integrations Guide",
  description: `Connect ${site.name} to CMS platforms, Slack, Zapier, and Make.com.`,
};

const integrations = [
  {
    name: "Zapier",
    plan: "Fleet",
    summary: "Catch Hook webhooks — pipe citation events to 5,000+ apps.",
    href: "/docs/zapier",
    setup: "Webhooks by Zapier → Catch Hook → paste URL in CitePilot",
  },
  {
    name: "Make.com",
    plan: "Fleet",
    summary: "Same flat JSON webhooks via Make's Custom webhook module.",
    href: "/docs/zapier",
    setup: "Webhooks → Custom webhook → paste URL in CitePilot",
  },
  {
    name: "Slack",
    plan: "Pilot+",
    summary: "OAuth connection for weekly digests and citation change alerts.",
    href: "/dashboard/settings/integrations",
    setup: "Settings → Integrations → Slack → Connect",
  },
  {
    name: "Webflow, WordPress, Ghost, Shopify, Framer",
    plan: "Pilot+",
    summary: "Publish generated articles directly to your CMS.",
    href: "/help/cms-publishing",
    setup: "Settings → Integrations → choose CMS → Connect",
  },
] as const;

export default function IntegrationsDocsPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="bg-cream">
        <Container className="py-14 md:py-20">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Documentation
          </p>
          <h1 className="font-display mt-2 text-3xl font-bold text-ink md:text-4xl">
            {site.name} integrations
          </h1>
          <p className="mt-4 max-w-2xl text-muted">
            Connect monitoring output to the tools your team already uses — CMS publishing, Slack
            alerts, and no-code automation via Zapier and Make.com.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {integrations.map((item) => (
              <article
                key={item.name}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-display text-lg font-bold text-ink">{item.name}</h2>
                  <span className="rounded-full bg-surface px-2.5 py-0.5 text-[11px] font-semibold text-muted">
                    {item.plan}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted">{item.summary}</p>
                <p className="mt-3 text-xs text-ink">
                  <span className="font-semibold">Setup:</span> {item.setup}
                </p>
                <Link
                  href={item.href}
                  className="mt-4 inline-block text-sm font-semibold text-accent hover:underline"
                >
                  Learn more →
                </Link>
              </article>
            ))}
          </div>

          <section className="mt-12">
            <h2 className="font-display text-xl font-bold text-ink">Webhook field reference</h2>
            <p className="mt-2 text-sm text-muted">
              All webhook payloads use flat keys (no nested objects) so Zapier and Make can map
              fields without code.
            </p>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-surface text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Field</th>
                    <th className="px-4 py-3 font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    ["event", "Event type (citation.change_detected or audit.completed)"],
                    ["workspace_domain", "Monitored domain"],
                    ["workspace_id", "CitePilot workspace ID"],
                    ["prompt", "Buyer question / money prompt"],
                    ["platform", "AI surface (e.g. chatgpt)"],
                    ["change", "gained or lost (citation events only)"],
                    ["delta", "Human-readable change, e.g. +8%"],
                    ["citation_score", "Score 0–100 (audit.completed only)"],
                    ["report_url", "Link to citation report in dashboard"],
                    ["timestamp", "ISO 8601 UTC time"],
                  ].map(([field, desc]) => (
                    <tr key={field}>
                      <td className="px-4 py-3 font-mono text-xs text-ink">{field}</td>
                      <td className="px-4 py-3 text-muted">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <p className="mt-10 text-sm text-muted">
            Manage connections in{" "}
            <Link
              href="/dashboard/settings/integrations"
              className="font-semibold text-accent hover:underline"
            >
              Dashboard → Settings → Integrations
            </Link>
            . Developer reference:{" "}
            <Link href="/docs/api#webhooks" className="font-semibold text-accent hover:underline">
              API webhooks
            </Link>
            .
          </p>
        </Container>
      </main>
      <Footer />
    </>
  );
}
