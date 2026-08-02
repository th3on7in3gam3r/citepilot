import type { GscMetrics } from "@/lib/gsc/client";
import type { WorkspaceSnapshot } from "@/lib/dashboard";
import { CHART_PALETTE } from "@/lib/charts/theme";

function formatDayLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(d);
}

export function buildGoogleDailySeries(metrics: GscMetrics) {
  const daily = metrics.daily ?? [];
  return {
    labels: daily.map((d) => formatDayLabel(d.date)),
    clicks: daily.map((d) => d.clicks),
    impressions: daily.map((d) => d.impressions),
    hasData: daily.length > 0,
  };
}

export function buildGoogleKpis(metrics: GscMetrics) {
  return {
    clicks: metrics.clicks,
    impressions: metrics.impressions,
    ctr: Math.round((metrics.ctr ?? 0) * 1000) / 10,
    position: metrics.position,
    clicksDelta: metrics.clicksDelta,
    impressionsDelta: metrics.impressionsDelta,
    siteUrl: metrics.siteUrl,
  };
}

export function buildCtrBarSeries(metrics: GscMetrics) {
  const daily = metrics.daily ?? [];
  if (daily.length === 0) return { labels: [], values: [] };
  return {
    labels: daily.map((d) => formatDayLabel(d.date)),
    values: daily.map((d) =>
      d.impressions > 0 ? Math.round((d.clicks / d.impressions) * 1000) / 10 : 0,
    ),
  };
}

export function buildOrganicPolarSegments(metrics: GscMetrics) {
  const clicks = Math.max(metrics.clicks, 1);
  const impressions = Math.max(metrics.impressions, 1);
  const ctr = Math.max(metrics.ctr * 100, 0.1);
  const positionScore = Math.max(0, Math.min(100, 100 - metrics.position * 5));

  return [
    { label: "Clicks", value: clicks, color: CHART_PALETTE[0] },
    { label: "Impressions", value: impressions / 10, color: CHART_PALETTE[1] },
    { label: "CTR %", value: ctr * 10, color: CHART_PALETTE[2] },
    { label: "Position score", value: positionScore, color: CHART_PALETTE[3] },
  ];
}

export function buildOrganicRadarValues(metrics: GscMetrics) {
  const maxClicks = Math.max(...(metrics.daily?.map((d) => d.clicks) ?? [metrics.clicks]), 1);
  const maxImpressions = Math.max(
    ...(metrics.daily?.map((d) => d.impressions) ?? [metrics.impressions]),
    1,
  );
  const avgDailyClicks =
    metrics.daily.length > 0
      ? metrics.daily.reduce((s, d) => s + d.clicks, 0) / metrics.daily.length
      : metrics.clicks / 28;
  const avgDailyImpressions =
    metrics.daily.length > 0
      ? metrics.daily.reduce((s, d) => s + d.impressions, 0) / metrics.daily.length
      : metrics.impressions / 28;

  return {
    labels: ["Clicks", "Impressions", "CTR", "Avg position", "Momentum"],
    values: [
      Math.round((avgDailyClicks / maxClicks) * 100),
      Math.round((avgDailyImpressions / maxImpressions) * 100),
      Math.round(metrics.ctr * 100),
      Math.max(0, Math.min(100, 100 - metrics.position * 4)),
      parseMomentum(metrics.clicksDelta),
    ],
  };
}

function parseMomentum(delta: string | null): number {
  if (!delta) return 50;
  const n = Number(delta.replace(/[^0-9-]/g, ""));
  if (Number.isNaN(n)) return 50;
  return Math.max(0, Math.min(100, 50 + n * 2));
}

export function buildCitationVsOrganicSeries(
  workspace: WorkspaceSnapshot,
  metrics: GscMetrics,
) {
  const history = workspace.citationHistory ?? [];
  const daily = metrics.daily ?? [];
  if (history.length === 0 || daily.length === 0) {
    return { labels: [], citation: [], organic: [], hasData: false };
  }

  const labels = daily.map((d) => formatDayLabel(d.date));
  const maxClicks = Math.max(...daily.map((d) => d.clicks), 1);
  const organic = daily.map((d) => Math.round((d.clicks / maxClicks) * 100));

  const latestCitation = history[history.length - 1]?.visibilityIndex ?? workspace.citationScore;
  const citation = daily.map(() => latestCitation);

  return { labels, citation, organic, hasData: true };
}
