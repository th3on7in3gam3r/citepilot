"use client";

import Link from "next/link";
import type { WorkspaceSnapshot } from "@/lib/dashboard";

function MiniSparkline({ seed }: { seed: number }) {
  const points = Array.from({ length: 8 }, (_, i) => {
    const v = 20 + i * 8 + ((seed + i * 11) % 12);
    return `${i * 14},${40 - v / 2}`;
  }).join(" ");

  return (
    <svg viewBox="0 0 98 40" className="mt-3 h-10 w-full" aria-hidden>
      <polyline
        fill="none"
        stroke="#f97316"
        strokeWidth={2}
        strokeLinecap="round"
        points={points}
      />
    </svg>
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
          <p className="mt-1 text-xs font-semibold text-red-500">
            {String(geoIssues).padStart(2, "0")} issues found
          </p>
          <ul className="mt-3 space-y-2 text-xs">
            <li className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2 text-red-700">
              Missing answer capsule
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold">
                Check
              </span>
            </li>
            <li className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2 text-red-700">
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
