"use client";

import Link from "next/link";
import { useMemo } from "react";
import { DashboardBarChart } from "@/components/charts/DashboardCharts";
import { buildPlatformVisibilityBars } from "@/lib/chart-data";

type CitationVisibilityBarChartProps = {
  platformRows: { name: string; cited: boolean; share?: number }[];
  hasRealAudit: boolean;
  domain: string;
  compact?: boolean;
};

export function CitationVisibilityBarChart({
  platformRows,
  hasRealAudit,
  domain,
  compact = false,
}: CitationVisibilityBarChartProps) {
  const bars = useMemo(
    () => buildPlatformVisibilityBars(platformRows),
    [platformRows],
  );

  const citedCount = bars.filter((b) => b.cited).length;

  if (!hasRealAudit) {
    return (
      <div
        className={`overflow-hidden rounded-2xl border border-dashed border-border bg-surface/40 ${
          compact ? "p-4" : "p-6 md:p-8"
        }`}
      >
        <h2 className="font-display text-lg font-bold text-ink md:text-xl">
          Citation visibility
        </h2>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Run a citation audit on {domain} to see per-platform visibility bars for
          ChatGPT, Perplexity, Google AI Overviews, and other answer surfaces.
        </p>
        {!compact && (
          <Link
            href="/audit"
            className="mt-4 inline-flex rounded-full bg-gradient-to-r from-[#7b93f0] via-[#6b8cff] to-accent px-5 py-2.5 text-sm font-semibold text-white"
          >
            Run citation audit
          </Link>
        )}
      </div>
    );
  }

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] ${
        compact ? "p-4" : "p-6 md:p-8"
      }`}
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-ink md:text-xl">
            Citation visibility
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Estimated share of model on your monitored prompts — by AI answer
            surface from your latest audit.
          </p>
        </div>
        <div className="mt-2 rounded-full border border-mint/30 bg-mint/10 px-3 py-1 text-xs font-semibold text-mint sm:mt-0">
          {citedCount}/{bars.length} platforms citing you
        </div>
      </div>

      <div className="mt-6" role="img" aria-label="Citation visibility by AI platform bar chart">
        <DashboardBarChart
          labels={bars.map((b) => b.shortLabel)}
          height={compact ? 200 : 260}
          showLegend={false}
          series={[
            {
              name: "Visibility",
              values: bars.map((b) => b.value),
              colors: bars.map((b) => (b.cited ? b.color : "#cbd5e1")),
            },
          ]}
        />
      </div>

      {!compact && (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {bars.map((bar) => (
            <li
              key={`legend-${bar.id}`}
              className="flex items-center gap-2 rounded-lg bg-surface/80 px-3 py-2 text-xs"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: bar.cited ? bar.color : "#cbd5e1" }}
                aria-hidden
              />
              <span className="font-medium text-ink">{bar.label}</span>
              <span className="ml-auto font-semibold tabular-nums text-muted">
                {bar.value}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
