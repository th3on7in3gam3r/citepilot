"use client";

import Link from "next/link";
import { DashboardSparkline } from "@/components/charts/DashboardCharts";
import { CHART_COLORS } from "@/lib/charts/theme";
import type { WorkspaceSnapshot } from "@/lib/dashboard";

function MiniSparkline({ seed }: { seed: number }) {
  const values = Array.from({ length: 8 }, (_, i) => 20 + i * 8 + ((seed + i * 11) % 12));
  return (
    <div className="mt-3 h-10 w-full">
      <DashboardSparkline values={values} color={CHART_COLORS.primary} className="h-full w-full" />
    </div>
  );
}

export function DashboardOverviewCards({
  workspace,
  seed,
}: {
  workspace: WorkspaceSnapshot;
  seed: number;
}) {
  const geoIssues = Math.max(1, 6 - workspace.citedPlatforms);

  return (
    <section className="mt-8">
      <h2 className="mb-4 font-display text-lg font-bold text-ink">
        Your overview
      </h2>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-ink">Citation rating</p>
          <p className="font-display mt-2 text-4xl font-bold text-ink">
            {workspace.citationScore}
          </p>
          <MiniSparkline seed={seed} />
          <Link
            href="/dashboard/analytics"
            className="mt-4 block text-sm font-semibold text-accent hover:text-accent-deep"
          >
            View more →
          </Link>
        </div>

        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-ink">Discussion opportunities</p>
          <p className="font-display mt-2 text-4xl font-bold text-ink">
            {workspace.communityMentions}
          </p>
          <ul className="mt-3 space-y-2 text-xs text-muted">
            <li className="rounded-lg bg-surface px-3 py-2">
              Hacker News · launch &amp; tool threads
            </li>
            <li className="rounded-lg bg-surface px-3 py-2">
              Stack Overflow · buyer questions
            </li>
          </ul>
          <Link
            href="/dashboard/discussions"
            className="mt-4 block text-sm font-semibold text-accent hover:text-accent-deep"
          >
            View more →
          </Link>
        </div>

        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-ink">GEO score</p>
          <p className="font-display mt-2 text-4xl font-bold text-ink">
            {workspace.citationScore}
            <span className="text-lg font-normal text-muted">/100</span>
          </p>
          <p className="mt-1 text-xs font-semibold text-amber-700">
            {String(geoIssues).padStart(2, "0")} issues found
          </p>
          <ul className="mt-3 space-y-2 text-xs">
            <li className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 text-amber-900">
              Missing answer capsule
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold">
                Check
              </span>
            </li>
            <li className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 text-amber-900">
              Weak FAQ schema
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold">
                Check
              </span>
            </li>
          </ul>
          <Link
            href="/dashboard/geo-audit"
            className="mt-4 block text-sm font-semibold text-accent hover:text-accent-deep"
          >
            View more →
          </Link>
        </div>
      </div>
    </section>
  );
}
