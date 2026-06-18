import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/ui/Container";
import { site } from "@/lib/site";
import type { Metadata } from "next";
import Link from "next/link";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Zapier Integration",
  description: `Connect ${site.name} to Zapier with outgoing webhooks — pipe citation events into Slack, Notion, Google Sheets, and 5,000+ apps.`,
};

export default function ZapierDocsPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="bg-cream">
        <Container className="py-14 md:py-20">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Integrations
          </p>
          <h1 className="font-display mt-2 text-3xl font-bold text-ink md:text-4xl">
            Zapier integration (Catch Hook)
          </h1>
          <p className="mt-4 max-w-2xl text-muted">
            Fleet users can send {site.name} events to Zapier without writing code. CitePilot
            POSTs flat JSON to your Zapier Catch Hook URL whenever citations change or audits
            complete.
          </p>

          <section className="mt-10 space-y-4">
            <h2 className="font-display text-xl font-bold text-ink">How it works</h2>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-ink">
              <li>
                In Zapier, create a new Zap with trigger{" "}
                <strong>Webhooks by Zapier → Catch Hook</strong>. Copy the webhook URL.
              </li>
              <li>
                In {site.name}:{" "}
                <Link href="/dashboard/settings/integrations" className="text-accent hover:underline">
                  Settings → Integrations
                </Link>{" "}
                → paste the URL, add a signing secret, and save.
              </li>
              <li>
                Click <strong>Send test event</strong> — Zapier should receive sample fields.
              </li>
              <li>
                Add any Zapier action (Slack, Google Sheets, Notion, HubSpot, etc.) and map flat
                fields like <code className="text-xs">prompt</code>,{" "}
                <code className="text-xs">change</code>, and{" "}
                <code className="text-xs">workspace_domain</code>.
              </li>
            </ol>
          </section>

          <section className="mt-10">
            <h2 className="font-display text-xl font-bold text-ink">Sample payload</h2>
            <pre className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card p-4 text-xs text-ink">
{`{
  "event": "citation.change_detected",
  "workspace_domain": "brightlayer.io",
  "workspace_id": "abc123",
  "prompt": "best CRM for agencies",
  "platform": "chatgpt",
  "change": "gained",
  "citation_rate_before": 0.50,
  "citation_rate_after": 0.58,
  "delta": "+8%",
  "timestamp": "2026-06-14T08:00:00Z",
  "report_url": "https://getcitepilot.com/dashboard/geo-audit?workspace=abc123"
}`}
            </pre>
          </section>

          <section className="mt-10 space-y-3">
            <h2 className="font-display text-xl font-bold text-ink">Events</h2>
            <ul className="list-disc space-y-2 pl-5 text-sm text-muted">
              <li>
                <strong className="text-ink">citation.change_detected</strong> — fired when a
                prompt gains or loses citation coverage after a scan.
              </li>
              <li>
                <strong className="text-ink">audit.completed</strong> — fired when a citation audit
                finishes (score, citation rate, report link).
              </li>
            </ul>
            <p className="text-sm text-muted">
              Toggle events in Settings → Notifications → Webhooks.
            </p>
          </section>

          <section className="mt-10 rounded-2xl border border-dashed border-border bg-surface p-6">
            <h2 className="font-display text-lg font-bold text-ink">Native Zapier app (coming soon)</h2>
            <p className="mt-2 text-sm text-muted">
              A first-party Zapier app with OAuth will let users discover {site.name} in Zapier&apos;s
              app directory. Planned triggers: New Citation Result, Citation Drop Alert, Audit
              Completed. Planned actions: Add Prompt, Trigger Scan. Register at{" "}
              <a
                href="https://developer.zapier.com"
                className="font-semibold text-accent hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                developer.zapier.com
              </a>{" "}
              when ready to build Option B.
            </p>
          </section>

          <p className="mt-10 text-sm text-muted">
            Also works with{" "}
            <Link href="/docs/integrations" className="font-semibold text-accent hover:underline">
              Make.com
            </Link>{" "}
            using the Custom webhook module. See{" "}
            <Link href="/docs/api#webhooks" className="font-semibold text-accent hover:underline">
              API webhook docs
            </Link>{" "}
            for HMAC verification.
          </p>
        </Container>
      </main>
      <Footer />
    </>
  );
}
