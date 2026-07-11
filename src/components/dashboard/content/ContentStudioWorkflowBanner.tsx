"use client";

import Link from "next/link";

export function ContentStudioWorkflowBanner() {
  return (
    <div className="mb-5 rounded-2xl border border-accent/20 bg-accent/5 px-4 py-3 dark:border-accent/25 dark:bg-accent/10">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
        Content Studio workflow
      </p>
      <p className="mt-1 text-sm text-muted">
        <Link href="/dashboard/optimizer" className="font-semibold text-ink hover:text-accent">
          Site Optimizer
        </Link>{" "}
        turns audit gaps into fix plans and briefs. Content Studio generates full articles, queues
        drafts, and publishes to your CMS — or use{" "}
        <Link href="/dashboard/growth-loop" className="font-semibold text-ink hover:text-accent">
          Growth Loop
        </Link>{" "}
        for daily autopilot.
      </p>
    </div>
  );
}
