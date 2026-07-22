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

/** Decorative empty chart silhouette — no fabricated data series. */
function ChartSilhouette({ height = 160 }: { height?: number }) {
  return (
    <svg
      viewBox="0 0 320 120"
      className="mx-auto w-full max-w-md text-border"
      style={{ height }}
      aria-hidden
    >
      <line x1="24" y1="100" x2="296" y2="100" stroke="currentColor" strokeWidth="1.5" />
      <line x1="24" y1="20" x2="24" y2="100" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M40 88 C70 88, 80 55, 110 52 S160 70, 190 48 S240 30, 280 36"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M40 88 C70 88, 80 55, 110 52 S160 70, 190 48 S240 30, 280 36 L280 100 L40 100 Z"
        fill="currentColor"
        opacity="0.08"
      />
      <circle cx="110" cy="52" r="3" fill="currentColor" opacity="0.45" />
      <circle cx="190" cy="48" r="3" fill="currentColor" opacity="0.45" />
      <circle cx="280" cy="36" r="3" fill="currentColor" opacity="0.45" />
    </svg>
  );
}

function EmptyChart({
  message,
  actionHref = "/dashboard/geo-audit",
  actionLabel = "Run GEO audit →",
}: {
  message: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface/40 px-4 py-6 text-center">
      <ChartSilhouette height={100} />
      <p className="mt-3 max-w-sm text-sm text-muted">{message}</p>
      <Link
        href={actionHref}
        className="mt-4 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white transition hover:bg-accent-deep"
      >
        {actionLabel}
      </Link>
    </div>
  );
}

function PreAuditChartsBanner() {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-accent/25 bg-gradient-to-br from-accent/[0.07] via-card to-card p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="font-display text-base font-bold text-ink">
          Charts unlock after your first GEO audit
        </p>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          Citation trend, platform bars, and prompt coverage use live scan data —
          not projected placeholders. Run an audit to fill this Chart.js grid.
        </p>
        <div className="mt-3 hidden sm:block">
          <ChartSilhouette height={72} />
        </div>
      </div>
      <Link
        href="/dashboard/geo-audit"
        className="inline-flex shrink-0 items-center justify-center rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-deep"
      >
        Run GEO audit →
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

  const auditBadge = kpis.hasRealAudit ? "Live audit" : "Awaiting audit";
  const showLiveRadar = kpis.hasRealAudit;
  const showLivePolar = kpis.hasRealAudit && polar.length > 0;

  return (
    <div className="space-y-4">
      {!kpis.hasRealAudit && <PreAuditChartsBanner />}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile
          label="Citation score"
          value={kpis.hasRealAudit ? `${kpis.citationScore}` : "—"}
          hint={auditBadge}
        />
        <KpiTile
          label="Visibility"
          value={kpis.hasRealAudit ? `${kpis.visibilityScore}%` : "—"}
          hint="Across tracked prompts"
        />
        <KpiTile
          label="Platforms citing you"
          value={
            kpis.hasRealAudit
              ? `${kpis.citedPlatforms}/${kpis.totalPlatforms}`
              : "—"
          }
          hint="AI answer surfaces"
        />
        <KpiTile
          label="Prompts cited"
          value={
            kpis.hasRealAudit
              ? `${kpis.citedPrompts}/${kpis.totalPrompts || "—"}`
              : "—"
          }
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
          {showLiveRadar ? (
            <DashboardRadarChart
              labels={radar.labels}
              values={radar.values}
              height={280}
            />
          ) : (
            <EmptyChart message="Radar profile fills in after your first citation audit." />
          )}
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
          {showLivePolar ? (
            <div className="mx-auto max-w-xl">
              <DashboardPolarAreaChart segments={polar} height={300} />
            </div>
          ) : (
            <EmptyChart message="Polar share chart appears after platforms are scored in an audit." />
          )}
        </ChartCard>
      </div>
    </div>
  );
}
