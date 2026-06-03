"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { ExecutiveBriefingMetrics } from "@/lib/citation-grade";

function StatIcon({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-emerald-300">
      {children}
    </span>
  );
}

function CoverageBar({ pct }: { pct: number }) {
  return (
    <div
      className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-[width] duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function ExecutiveBriefingStatCards({
  metrics,
}: {
  metrics: ExecutiveBriefingMetrics;
}) {
  const audienceSubtitle =
    metrics.audienceCount === 0
      ? "Add in Settings"
      : metrics.primaryAudience
        ? truncate(metrics.primaryAudience, 22)
        : `${metrics.audienceCount} segment${metrics.audienceCount === 1 ? "" : "s"}`;

  const platformSubtitle =
    metrics.platformsMissing === 0
      ? "Full AI surface coverage"
      : `${metrics.platformsMissing} surface${metrics.platformsMissing === 1 ? "" : "s"} missing`;

  const planSubtitle = metrics.hasGeneratedStrategy
    ? "From your 30-day strategy"
    : "Default roadmap · generate in Content";

  return (
    <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Link
        href="/dashboard/settings"
        className="group flex flex-col rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] px-3.5 py-3.5 transition hover:border-emerald-500/30 hover:bg-white/[0.08]"
      >
        <div className="flex items-start gap-3">
          <StatIcon>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M16 11c1.66 0 3-1.34 3-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 2.05 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"
                fill="currentColor"
              />
            </svg>
          </StatIcon>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
              Audiences
            </p>
            <p className="font-display mt-0.5 text-2xl font-bold leading-none text-white">
              {metrics.audienceCount}
            </p>
            <p className="mt-1.5 truncate text-[11px] leading-snug text-white/50 group-hover:text-emerald-200/80">
              {audienceSubtitle}
            </p>
          </div>
        </div>
      </Link>

      <Link
        href="/dashboard/analytics"
        className="group flex flex-col rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] px-3.5 py-3.5 transition hover:border-emerald-500/30 hover:bg-white/[0.08]"
      >
        <div className="flex items-start gap-3">
          <StatIcon>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M4 6h16v2H4V6zm0 5h10v2H4v-2zm0 5h16v2H4v-2z"
                fill="currentColor"
              />
            </svg>
          </StatIcon>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
              AI surfaces
            </p>
            <p className="font-display mt-0.5 text-2xl font-bold leading-none text-white">
              {metrics.platformsCited}
              <span className="text-base font-medium text-white/35">
                /{metrics.platformsTotal}
              </span>
            </p>
            <CoverageBar pct={metrics.platformCoveragePct} />
            <p className="mt-1.5 text-[11px] leading-snug text-white/50 group-hover:text-emerald-200/80">
              {platformSubtitle}
            </p>
          </div>
        </div>
      </Link>

      <Link
        href="/dashboard/content"
        className="group flex flex-col rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] px-3.5 py-3.5 transition hover:border-emerald-500/30 hover:bg-white/[0.08]"
      >
        <div className="flex items-start gap-3">
          <StatIcon>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"
                fill="currentColor"
              />
            </svg>
          </StatIcon>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
              Content plan
            </p>
            <p className="font-display mt-0.5 text-2xl font-bold leading-none text-white">
              {metrics.planWeeks}
              <span className="ml-0.5 text-sm font-semibold text-white/40">wk</span>
            </p>
            <p className="mt-2 text-[11px] leading-snug text-white/50 group-hover:text-emerald-200/80">
              {planSubtitle}
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}
