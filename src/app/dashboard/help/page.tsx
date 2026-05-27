import Link from "next/link";
import { DashboardPageHeader, Panel } from "@/components/dashboard/DashboardUI";
import { site } from "@/lib/site";

const docs = [
  {
    title: "CMS publishing guide",
    description:
      "What CMS connections are for, when to use them, and what credentials each provider needs.",
    href: "/help/cms-publishing",
    cta: "Open guide",
  },
  {
    title: "Need setup help?",
    description:
      "If you get stuck connecting a CMS or understanding a workflow, contact support for help.",
    href: `mailto:${site.supportEmail}`,
    cta: "Email support",
  },
] as const;

const quickAnswers = [
  {
    q: "Do I need a CMS to use CitePilot?",
    a: "No. CMS publishing is optional. You can still run audits, track prompts, and generate articles without connecting one.",
  },
  {
    q: "How much can I use before I need to pay?",
    a: "Free includes 1 workspace and a citation audit. Upgrade when you want more workspaces or paid features like monitoring, article generation, CMS publishing, and alerts.",
  },
  {
    q: "What do I get when I upgrade?",
    a: "Pilot gives you up to 3 workspaces plus monitoring, article generation, CMS publishing, and email alerts. Fleet adds unlimited client workspaces, white-label reporting, API access, bulk import, and priority support.",
  },
  {
    q: "Where are the docs today?",
    a: "Start with the CMS publishing guide (Webflow, WordPress, Ghost, Shopify, Framer). Fleet users can also import prompts via CSV and use API keys under Settings.",
  },
] as const;

export default function DashboardHelpPage() {
  return (
    <>
      <DashboardPageHeader
        title="Help"
        description="Find guides, quick answers, and support links without leaving the dashboard."
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel>
          <div className="overflow-hidden rounded-2xl border border-[#d7def8] bg-[linear-gradient(135deg,rgba(123,147,240,0.08),rgba(255,255,255,0.98),rgba(34,211,238,0.06))] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
              Help center
            </p>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
              This area is for user-facing docs and guidance. Start here when you need a
              walkthrough, setup checklist, or direct support path.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {docs.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] p-5 shadow-sm"
              >
                <p className="font-semibold text-ink">{item.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {item.description}
                </p>
                <Link
                  href={item.href}
                  className="mt-4 inline-flex rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-accent/40 hover:bg-accent/5"
                >
                  {item.cta}
                </Link>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Quick answers">
          <div className="space-y-4">
            {quickAnswers.map((item) => (
              <div
                key={item.q}
                className="rounded-2xl border border-border bg-surface/60 px-5 py-4"
              >
                <p className="font-semibold text-ink">{item.q}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.a}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
