"use client";

import Link from "next/link";
import { DashboardSparkline } from "@/components/charts/DashboardCharts";
import { CHART_COLORS } from "@/lib/charts/theme";
import type { WorkspaceSnapshot } from "@/lib/dashboard";

function MiniSparkline({ seed, color }: { seed: number; color?: string }) {
  const values = Array.from({ length: 8 }, (_, i) => 20 + i * 8 + ((seed + i * 11) % 12));
  return (
    <div className="mt-3 h-10 w-full">
      <DashboardSparkline
        values={values}
        color={color ?? CHART_COLORS.primary}
        className="h-full w-full"
      />
    </div>
  );
}

const CARD_CONFIGS = [
  {
    key: "citation",
    label: "Citation rating",
    href: "/dashboard/analytics",
    gradient: "from-[#0ea5e9]/5 to-[#22d3ee]/5",
    accentBar: "from-[#0ea5e9] to-[#22d3ee]",
    labelColor: "text-[#0ea5e9]",
  },
  {
    key: "discussions",
    label: "Discussion opportunities",
    href: "/dashboard/discussions",
    gradient: "from-[#6366f1]/5 to-[#a78bfa]/5",
    accentBar: "from-[#6366f1] to-[#a78bfa]",
    labelColor: "text-[#6366f1]",
    sparkColor: "#6366f1",
  },
  {
    key: "geo",
    label: "GEO score",
    href: "/dashboard/geo-audit",
    gradient: "from-[#10b981]/5 to-[#22d3ee]/5",
    accentBar: "from-[#10b981] to-[#22d3ee]",
    labelColor: "text-[#10b981]",
    sparkColor: "#10b981",
  },
] as const;

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
      <h2 className="mb-4 font-display text-lg font-bold text-ink">Your overview</h2>
      <div className="grid gap-4 lg:grid-cols-3">

        {/* Citation rating */}
        <div className={`group relative overflow-hidden rounded-2xl border border-[#e8edf3] bg-gradient-to-br ${CARD_CONFIGS[0].gradient} p-5 shadow-[0_2px_8px_rgba(15,23,42,0.05)] transition-shadow hover:shadow-[0_4px_20px_rgba(15,23,42,0.09)]`}>
          <div className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r opacity-0 transition-opacity group-hover:opacity-100 ${CARD_CONFIGS[0].accentBar}`} aria-hidden />
          <p className={`text-[11px] font-semibold uppercase tracking-wide ${CARD_CONFIGS[0].labelColor}`}>
            {CARD_CONFIGS[0].label}
          </p>
          <p className="font-display mt-2 text-4xl font-bold tracking-tight text-[#0f172a]">
            {workspace.citationScore}
          </p>
          <MiniSparkline seed={seed} />
          <Link
            href={CARD_CONFIGS[0].href}
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#0ea5e9] transition-colors hover:text-[#0284c7]"
          >
            View more <span aria-hidden>→</span>
          </Link>
        </div>

        {/* Discussion opportunities */}
        <div className={`group relative overflow-hidden rounded-2xl border border-[#e8edf3] bg-gradient-to-br ${CARD_CONFIGS[1].gradient} p-5 shadow-[0_2px_8px_rgba(15,23,42,0.05)] transition-shadow hover:shadow-[0_4px_20px_rgba(15,23,42,0.09)]`}>
          <div className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r opacity-0 transition-opacity group-hover:opacity-100 ${CARD_CONFIGS[1].accentBar}`} aria-hidden />
          <p className={`text-[11px] font-semibold uppercase tracking-wide ${CARD_CONFIGS[1].labelColor}`}>
            {CARD_CONFIGS[1].label}
          </p>
          <p className="font-display mt-2 text-4xl font-bold tracking-tight text-[#0f172a]">
            {workspace.communityMentions}
          </p>
          <ul className="mt-3 space-y-2 text-xs">
            <li className="rounded-xl bg-white/70 px-3 py-2 text-[#64748b] shadow-[0_1px_2px_rgba(15,23,42,0.04)] backdrop-blur-sm">
              Hacker News · launch &amp; tool threads
            </li>
            <li className="rounded-xl bg-white/70 px-3 py-2 text-[#64748b] shadow-[0_1px_2px_rgba(15,23,42,0.04)] backdrop-blur-sm">
              Stack Overflow · buyer questions
            </li>
          </ul>
          <Link
            href={CARD_CONFIGS[1].href}
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#6366f1] transition-colors hover:text-[#4f46e5]"
          >
            View more <span aria-hidden>→</span>
          </Link>
        </div>

        {/* GEO score */}
        <div className={`group relative overflow-hidden rounded-2xl border border-[#e8edf3] bg-gradient-to-br ${CARD_CONFIGS[2].gradient} p-5 shadow-[0_2px_8px_rgba(15,23,42,0.05)] transition-shadow hover:shadow-[0_4px_20px_rgba(15,23,42,0.09)]`}>
          <div className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r opacity-0 transition-opacity group-hover:opacity-100 ${CARD_CONFIGS[2].accentBar}`} aria-hidden />
          <p className={`text-[11px] font-semibold uppercase tracking-wide ${CARD_CONFIGS[2].labelColor}`}>
            {CARD_CONFIGS[2].label}
          </p>
          <p className="font-display mt-2 text-4xl font-bold tracking-tight text-[#0f172a]">
            {workspace.citationScore}
            <span className="ml-1 text-lg font-normal text-[#94a3b8]">/100</span>
          </p>
          <p className="mt-1 text-[11px] font-semibold text-amber-600">
            {String(geoIssues).padStart(2, "0")} issues found
          </p>
          <ul className="mt-3 space-y-2 text-xs">
            <li className="flex items-center justify-between rounded-xl bg-amber-50/80 px-3 py-2 text-amber-900 shadow-[0_1px_2px_rgba(180,83,9,0.06)]">
              Missing answer capsule
              <span className="ml-2 shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-amber-700 shadow-sm">
                Check
              </span>
            </li>
            <li className="flex items-center justify-between rounded-xl bg-amber-50/80 px-3 py-2 text-amber-900 shadow-[0_1px_2px_rgba(180,83,9,0.06)]">
              Weak FAQ schema
              <span className="ml-2 shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-amber-700 shadow-sm">
                Check
              </span>
            </li>
          </ul>
          <Link
            href={CARD_CONFIGS[2].href}
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#10b981] transition-colors hover:text-[#059669]"
          >
            View more <span aria-hidden>→</span>
          </Link>
        </div>

      </div>
    </section>
  );
}
