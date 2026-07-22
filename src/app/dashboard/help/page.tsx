import { DashboardPageHeader, Panel } from "@/components/dashboard/DashboardUI";
import {
  DashboardPrimaryCta,
  DashboardSecondaryCta,
} from "@/components/dashboard/layout/DashboardCta";
import Link from "next/link";
import {
  helpGuides,
  helpQuickAnswers,
  helpWorkflow,
} from "@/lib/help-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help",
  robots: { index: false, follow: false },
};

export default function DashboardHelpPage() {
  return (
    <div className="dash-page">
      <DashboardPageHeader
        title="Help"
        description="Guides, workflows, and answers for audits, monitoring, alerts, CMS, and Fleet."
        action={
          <DashboardPrimaryCta href="/dashboard/geo-audit" size="sm">
            Run GEO audit →
          </DashboardPrimaryCta>
        }
      />

      <div className="space-y-6">
        <Panel>
          <div className="overflow-hidden rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/[0.06] via-card to-card p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
              Help center
            </p>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
              CitePilot closes the loop: audit your money prompts, fix gaps, publish
              content, and re-scan to prove citation lift. Use the workflow below for
              your first session, then dig into guides and FAQs.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {helpGuides.map((item) => (
              <div
                key={item.title}
                className="dash-content-card flex flex-col p-5"
              >
                <p className="font-semibold text-ink">{item.title}</p>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                  {item.description}
                </p>
                <DashboardSecondaryCta
                  href={item.href}
                  size="sm"
                  className="mt-4 w-fit"
                  {...(item.external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  {item.cta}
                </DashboardSecondaryCta>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Recommended workflow">
          <ol className="space-y-4">
            {helpWorkflow.map((step, index) => (
              <li
                key={step.title}
                className="flex gap-4 rounded-2xl border border-border bg-surface/50 px-5 py-4"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{step.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    {step.description}
                  </p>
                  {step.href ? (
                    <Link
                      href={step.href}
                      className="mt-2 inline-block text-sm font-semibold text-accent hover:underline"
                    >
                      Go there →
                    </Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </Panel>

        <Panel title="Quick answers">
          <div className="grid gap-4 lg:grid-cols-2">
            {helpQuickAnswers.map((item) => (
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
    </div>
  );
}
