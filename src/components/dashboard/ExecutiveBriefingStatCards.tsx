"use client";

import Link from "next/link";
import type { ExecutiveBriefingMetrics } from "@/lib/citation-grade";

export function ExecutiveBriefingStatCards({
  metrics,
}: {
  metrics: ExecutiveBriefingMetrics;
}) {
  const audienceHint =
    metrics.audienceCount === 0
      ? "Add in Settings"
      : metrics.primaryAudience
        ? truncate(metrics.primaryAudience, 16)
        : `${metrics.audienceCount} set`;

  const platformHint =
    metrics.platformsMissing === 0
      ? "All covered"
      : `${metrics.platformsMissing} missing`;

  const planHint = metrics.hasGeneratedStrategy ? "30-day plan" : "Generate";

  return (
    <div className="mt-6 grid w-full grid-cols-3 gap-2">
      <StatCard
        href="/dashboard/settings"
        label="Audiences"
        value={String(metrics.audienceCount)}
        hint={audienceHint}
      />
      <StatCard
        href="/dashboard/analytics"
        label="AI surfaces"
        value={`${metrics.platformsCited}/${metrics.platformsTotal}`}
        hint={platformHint}
      />
      <StatCard
        href="/dashboard/content"
        label="Content"
        value={`${metrics.planWeeks}w`}
        hint={planHint}
      />
    </div>
  );
}

function StatCard({
  href,
  label,
  value,
  hint,
}: {
  href: string;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-w-0 flex-col items-center rounded-xl border border-white/10 bg-white/[0.04] px-2 py-3 text-center transition hover:border-white/20 hover:bg-white/[0.08]"
    >
      <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/45">
        {label}
      </span>
      <span className="font-display mt-1 text-lg font-bold leading-none text-white sm:text-xl">
        {value}
      </span>
      <span className="mt-1.5 line-clamp-2 text-[10px] leading-tight text-white/50">
        {hint}
      </span>
    </Link>
  );
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}
