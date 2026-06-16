"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  DashboardBarChart,
  DashboardDoughnutChart,
  DashboardLineChart,
  DashboardPolarAreaChart,
  DashboardRadarChart,
} from "@/components/charts/DashboardCharts";
import type { GscMetrics } from "@/lib/gsc/client";
import type { WorkspaceSnapshot } from "@/lib/dashboard";
import {
  buildCitationVsOrganicSeries,
  buildCtrBarSeries,
  buildGoogleDailySeries,
  buildGoogleKpis,
  buildOrganicPolarSegments,
  buildOrganicRadarValues,
} from "@/lib/analytics/google-chart-data";
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
            <span className="rounded-full border border-mint/30 bg-mint/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-mint">
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

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface/40 px-4 py-8 text-center">
      <p className="max-w-sm text-sm text-muted">{message}</p>
    </div>
  );
}

export function GoogleAnalyticsChartsGrid({
  workspace,
  metrics,
  connected,
  loading = false,
}: {
  workspace: WorkspaceSnapshot;
  metrics: GscMetrics | null;
  connected: boolean;
  loading?: boolean;
}) {
  const kpis = useMemo(
    () => (metrics ? buildGoogleKpis(metrics) : null),
    [metrics],
  );
  const daily = useMemo(
    () => (metrics ? buildGoogleDailySeries(metrics) : { labels: [], clicks: [], impressions: [], hasData: false }),
    [metrics],
  );
  const ctrBars = useMemo(
    () => (metrics ? buildCtrBarSeries(metrics) : { labels: [], values: [] }),
    [metrics],
  );
  const radar = useMemo(
    () => (metrics ? buildOrganicRadarValues(metrics) : { labels: [], values: [] }),
    [metrics],
  );
  const polar = useMemo(
    () => (metrics ? buildOrganicPolarSegments(metrics) : []),
    [metrics],
  );
  const bridge = useMemo(
    () =>
      metrics
        ? buildCitationVsOrganicSeries(workspace, metrics)
        : { labels: [], citation: [], organic: [], hasData: false },
    [workspace, metrics],
  );

  const doughnutSegments = useMemo(() => {
    if (!metrics || metrics.clicks === 0 && metrics.impressions === 0) {
      return [{ label: "No traffic", value: 1, color: "#cbd5e1" }];
    }
    return [
      { label: "Clicks", value: Math.max(metrics?.clicks ?? 0, 0.01), color: "#0ea5e9" },
      {
        label: "Impressions (scaled)",
        value: Math.max((metrics?.impressions ?? 0) / 100, 0.01),
        color: "#a78bfa",
      },
    ];
  }, [metrics]);

  if (loading) {
    return (
      <div className="mt-6 rounded-2xl border border-border bg-card px-6 py-12 text-center shadow-sm">
        <p className="text-sm text-muted">Loading Google Search Console charts…</p>
      </div>
    );
  }

  if (!connected || !metrics) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-border bg-surface/40 p-10 text-center">
        <p className="font-display text-lg font-bold text-ink">Connect Search Console for charts</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          The Google tab shows live organic charts once Search Console is linked — clicks,
          impressions, CTR trends, and citation comparison.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile
          label="Organic clicks"
          value={kpis?.clicks.toLocaleString() ?? "—"}
          hint={kpis?.clicksDelta ? `${kpis.clicksDelta} vs prior 28d` : "Last 28 days"}
        />
        <KpiTile
          label="Impressions"
          value={kpis?.impressions.toLocaleString() ?? "—"}
          hint={kpis?.impressionsDelta ? `${kpis.impressionsDelta} vs prior 28d` : "Last 28 days"}
        />
        <KpiTile
          label="CTR"
          value={`${kpis?.ctr ?? 0}%`}
          hint="Click-through rate"
        />
        <KpiTile
          label="Avg. position"
          value={kpis?.position.toFixed(1) ?? "—"}
          hint={kpis?.siteUrl ?? "GSC property"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <ChartCard
          title="Daily organic clicks"
          subtitle="Search Console clicks per day (last 28 days)"
          badge="Line"
          className="lg:col-span-8"
        >
          {daily.hasData ? (
            <DashboardLineChart
              labels={daily.labels}
              height={280}
              showLegend={false}
              fill
              series={[
                {
                  label: "Clicks",
                  values: daily.clicks,
                  color: CHART_SERIES.current,
                  fill: true,
                },
              ]}
            />
          ) : (
            <EmptyChart message="Daily click data will appear after Google indexes your first reporting day." />
          )}
        </ChartCard>

        <ChartCard
          title="Traffic mix"
          subtitle="Clicks vs impression volume (scaled)"
          badge="Doughnut"
          className="lg:col-span-4"
        >
          <DashboardDoughnutChart
            segments={doughnutSegments}
            height={200}
          />
        </ChartCard>

        <ChartCard
          title="Daily impressions"
          subtitle="How often your pages appeared in Google search"
          badge="Bar"
          className="lg:col-span-6"
        >
          {daily.hasData ? (
            <DashboardBarChart
              labels={daily.labels}
              height={260}
              showLegend={false}
              series={[{ name: "Impressions", values: daily.impressions, color: "#a78bfa" }]}
            />
          ) : (
            <EmptyChart message="Impression bars populate as Search Console reports daily data." />
          )}
        </ChartCard>

        <ChartCard
          title="Daily CTR"
          subtitle="Click-through rate by day"
          badge="Bar"
          className="lg:col-span-6"
        >
          {ctrBars.labels.length > 0 ? (
            <DashboardBarChart
              labels={ctrBars.labels}
              height={260}
              showLegend={false}
              series={[{ name: "CTR %", values: ctrBars.values, color: "#14b8a6" }]}
            />
          ) : (
            <EmptyChart message="CTR chart needs at least one day of Search Console data." />
          )}
        </ChartCard>

        <ChartCard
          title="Organic health radar"
          subtitle="Normalized view of clicks, impressions, CTR, and position"
          badge="Radar"
          className="lg:col-span-6"
        >
          <DashboardRadarChart
            labels={radar.labels}
            values={radar.values}
            height={280}
            color="#0ea5e9"
          />
        </ChartCard>

        <ChartCard
          title="Organic vs citation"
          subtitle="Normalized organic clicks alongside your latest citation score"
          badge="Line"
          className="lg:col-span-6"
        >
          {bridge.hasData ? (
            <DashboardLineChart
              labels={bridge.labels}
              height={280}
              yMax={100}
              showLegend
              series={[
                {
                  label: "Organic clicks (norm.)",
                  values: bridge.organic,
                  color: CHART_SERIES.current,
                  fill: true,
                },
                {
                  label: "Citation score",
                  values: bridge.citation,
                  color: CHART_SERIES.projected,
                  dashed: true,
                },
              ]}
            />
          ) : (
            <EmptyChart message="Run citation audits and collect GSC daily data to compare organic and AI visibility trends." />
          )}
        </ChartCard>

        <ChartCard
          title="Organic mix polar"
          subtitle="Relative weight of clicks, impressions, CTR, and position strength"
          badge="Polar"
          className="lg:col-span-12"
        >
          <div className="mx-auto max-w-xl">
            <DashboardPolarAreaChart segments={polar} height={300} />
          </div>
        </ChartCard>
      </div>

      {!daily.hasData && (
        <p className="text-center text-xs text-muted">
          Property connected — waiting for daily Search Console rows.{" "}
          <Link href="https://search.google.com/search-console" className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">
            Open Search Console
          </Link>
        </p>
      )}
    </div>
  );
}
