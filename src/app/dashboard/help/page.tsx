import Link from "next/link";
import { DashboardPageHeader, Panel } from "@/components/dashboard/DashboardUI";
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
    <>
      <DashboardPageHeader
        title="Help"
        description="Guides, workflows, and answers for audits, monitoring, alerts, CMS, and Fleet."
      />

      <div className="space-y-6">
        <Panel>
          <div className="overflow-hidden rounded-2xl border border-[#d7def8] bg-[linear-gradient(135deg,rgba(123,147,240,0.08),rgba(255,255,255,0.98),rgba(34,211,238,0.06))] p-5">
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
                className="rounded-2xl border border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] p-5 shadow-sm"
              >
                <p className="font-semibold text-ink">{item.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {item.description}
                </p>
                <Link
                  href={item.href}
                  className="mt-4 inline-flex rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-accent/40 hover:bg-accent/5"
                  {...(item.external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  {item.cta}
                </Link>
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
                  {step.href && (
                    <Link
                      href={step.href}
                      className="mt-2 inline-block text-sm font-semibold text-accent hover:underline"
                    >
                      Go there →
                    </Link>
                  )}
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
    </>
  );
}
