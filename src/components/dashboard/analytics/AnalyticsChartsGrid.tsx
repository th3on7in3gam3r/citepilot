"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  DashboardBarChart,
  DashboardBubbleChart,
  DashboardDoughnutChart,
  DashboardLineChart,
  DashboardPolarAreaChart,
  DashboardRadarChart,
} from "@/components/charts/DashboardCharts";
import { RosenHorizontalBarChart } from "@/components/charts/RosenBarChart";
import type { PlatformCitationRate } from "@/lib/citations/viz-data";
import type { WorkspaceSnapshot } from "@/lib/dashboard";
import type { PromptRow } from "@/lib/features";
import {
  analyticsKpis,
  buildCitationTrendSeries,
  buildPlatformBarSeries,
  buildPlatformRadarSeries,
  buildPolarPlatformSegments,
  buildPromptBubblePoints,
  buildPromptDoughnutSeries,
  buildPromptRankingBars,
} from "@/lib/analytics/chart-data";
import { CHART_SERIES } from "@/lib/charts/theme";

function ChartCard({
  title,
  subtitle,
  badge,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <article
      className={`flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm ${className}`}
    >
      <header className="border-b border-border/80 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="font-display text-sm font-bold text-ink">{title}</h3>
            {subtitle && <p className="mt-1 text-xs leading-relaxed text-muted">{subtitle}</p>}
          </div>
          {badge && (
            <span className="rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-accent">
              {badge}
            </span>
          )}
        </div>
      </header>
      <div className="flex flex-1 flex-col p-5">{children}</div>
    </article>
  );
}

function KpiTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="font-display mt-2 text-3xl font-bold text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

function EmptyChart({
  message,
  actionHref = "/audit",
  actionLabel = "Run citation audit",
}: {
  message: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface/40 px-4 py-8 text-center">
      <p className="max-w-sm text-sm text-muted">{message}</p>
      <Link
        href={actionHref}
        className="mt-4 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white"
      >
        {actionLabel}
      </Link>
    </div>
  );
}

export function AnalyticsChartsGrid({
  workspace,
  rows,
  platformRates,
}: {
  workspace: WorkspaceSnapshot;
  rows: PromptRow[];
  platformRates?: PlatformCitationRate[];
}) {
  const kpis = useMemo(() => analyticsKpis(workspace, rows), [workspace, rows]);
  const trend = useMemo(() => buildCitationTrendSeries(workspace), [workspace]);
  const platformBars = useMemo(() => buildPlatformBarSeries(workspace), [workspace]);
  const radar = useMemo(
    () => buildPlatformRadarSeries(workspace, platformRates),
    [workspace, platformRates],
  );
  const doughnut = useMemo(() => buildPromptDoughnutSeries(rows), [rows]);
  const promptBars = useMemo(() => buildPromptRankingBars(rows), [rows]);
  const bubbles = useMemo(() => buildPromptBubblePoints(rows), [rows]);
  const polar = useMemo(() => buildPolarPlatformSegments(workspace), [workspace]);

  const auditBadge = kpis.hasRealAudit ? "Live audit" : "Projected";

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile
          label="Citation score"
          value={`${kpis.citationScore}`}
          hint={auditBadge}
        />
        <KpiTile
          label="Visibility"
          value={`${kpis.visibilityScore}%`}
          hint="Across tracked prompts"
        />
        <KpiTile
          label="Platforms citing you"
          value={`${kpis.citedPlatforms}/${kpis.totalPlatforms}`}
          hint="AI answer surfaces"
        />
        <KpiTile
          label="Prompts cited"
          value={`${kpis.citedPrompts}/${kpis.totalPrompts || "—"}`}
          hint="Money prompts with coverage"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <ChartCard
          title="Citation trend"
          subtitle="Visibility index from saved audits over time"
          badge="Line"
          className="lg:col-span-8"
        >
          {trend.hasData ? (
            <DashboardLineChart
              labels={trend.labels}
              height={280}
              yMax={100}
              showLegend={false}
              fill
              series={[
                {
                  label: "Visibility",
                  values: trend.values,
                  color: CHART_SERIES.current,
                  fill: true,
                },
              ]}
            />
          ) : (
            <EmptyChart message="Run a citation audit to unlock your visibility trend line." />
          )}
        </ChartCard>

        <ChartCard
          title="Prompt coverage"
          subtitle="Share of tracked prompts where your brand is cited"
          badge="Doughnut"
          className="lg:col-span-4"
        >
          {rows.length > 0 || kpis.hasRealAudit ? (
            <DashboardDoughnutChart
              segments={doughnut.segments}
              total={doughnut.cited + doughnut.gaps}
              height={200}
            />
          ) : (
            <EmptyChart message="Add money prompts and run an audit to see cited vs gap split." />
          )}
        </ChartCard>

        <ChartCard
          title="Platform visibility"
          subtitle="Estimated citation strength by AI surface"
          badge="Bar"
          className="lg:col-span-6"
        >
          {kpis.hasRealAudit ? (
            <>
              <DashboardBarChart
                labels={platformBars.labels}
                height={260}
                showLegend={false}
                series={[
                  {
                    name: "Visibility %",
                    values: platformBars.values,
                    colors: platformBars.colors,
                  },
                ]}
              />
              <p className="mt-3 text-center text-xs text-muted">
                {platformBars.citedCount} of {platformBars.total} platforms citing your brand
              </p>
            </>
          ) : (
            <EmptyChart message="Per-platform visibility bars appear after your first citation audit." />
          )}
        </ChartCard>

        <ChartCard
          title="AI surface radar"
          subtitle="Coverage profile across major answer engines"
          badge="Radar"
          className="lg:col-span-6"
        >
          <DashboardRadarChart
            labels={radar.labels}
            values={radar.values}
            height={280}
          />
        </ChartCard>

        <ChartCard
          title="Top prompts by visibility"
          subtitle="Highest-performing buyer questions in your audit"
          badge="Horizontal bar"
          className="lg:col-span-7"
        >
          {promptBars.length > 0 ? (
            <RosenHorizontalBarChart
              data={promptBars}
              height={Math.max(220, promptBars.length * 36)}
              maxValue={100}
              formatValue={(v) => `${v}%`}
            />
          ) : (
            <EmptyChart message="Prompt rankings populate once audit results are available." />
          )}
        </ChartCard>

        <ChartCard
          title="Prompt visibility map"
          subtitle="Bubble size reflects model coverage per prompt"
          badge="Bubble"
          className="lg:col-span-5"
        >
          {bubbles.length > 0 ? (
            <DashboardBubbleChart points={bubbles} height={280} />
          ) : (
            <EmptyChart message="Bubble chart maps each prompt's visibility once audits complete." />
          )}
        </ChartCard>

        <ChartCard
          title="Platform share polar"
          subtitle="Relative weight of each AI surface in your citation mix"
          badge="Polar"
          className="lg:col-span-12"
        >
          <div className="mx-auto max-w-xl">
            <DashboardPolarAreaChart segments={polar} height={300} />
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
