import type { PlatformCitationRate } from "@/lib/citations/viz-data";
import type { WorkspaceSnapshot } from "@/lib/dashboard";
import { PLATFORMS } from "@/lib/dashboard";
import { platformRowsFromWorkspace } from "@/lib/dashboard-data";
import type { PromptRow } from "@/lib/features";
import { buildPlatformVisibilityBars } from "@/lib/chart-data";
import type { BubblePoint } from "@/components/charts/DashboardCharts";
import { CHART_PALETTE } from "@/lib/charts/theme";

function formatHistoryLabel(recordedAt: string, total: number): string {
  const parsed = new Date(recordedAt);
  if (Number.isNaN(parsed.getTime())) return "Audit";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: total <= 6 ? "numeric" : undefined,
  }).format(parsed);
}

export function buildCitationTrendSeries(workspace: WorkspaceSnapshot): {
  labels: string[];
  values: number[];
  hasData: boolean;
} {
  const history = workspace.citationHistory ?? [];
  if (history.length > 0) {
    return {
      labels: history.map((p, i, all) => formatHistoryLabel(p.recordedAt, all.length)),
      values: history.map((p) => Math.max(0, Math.min(100, p.visibilityIndex))),
      hasData: true,
    };
  }

  if (workspace.hasRealAudit) {
    return {
      labels: ["Latest audit"],
      values: [workspace.citationScore],
      hasData: true,
    };
  }

  return { labels: [], values: [], hasData: false };
}

export function buildPlatformBarSeries(workspace: WorkspaceSnapshot) {
  const platformRows = platformRowsFromWorkspace(workspace, PLATFORMS);
  const bars = buildPlatformVisibilityBars(platformRows);
  return {
    labels: bars.map((b) => b.shortLabel),
    values: bars.map((b) => b.value),
    colors: bars.map((b) => b.color),
    citedCount: bars.filter((b) => b.cited).length,
    total: bars.length,
  };
}

export function buildPlatformRadarSeries(
  workspace: WorkspaceSnapshot,
  platformRates?: PlatformCitationRate[],
) {
  if (platformRates && platformRates.length > 0) {
    const top = platformRates.filter((p) => p.total > 0).slice(0, 6);
    return {
      labels: top.map((p) => p.label),
      values: top.map((p) => p.rate),
    };
  }

  const platformRows = platformRowsFromWorkspace(workspace, PLATFORMS).slice(0, 6);
  return {
    labels: platformRows.map((p) => p.name.split(" ")[0] ?? p.name),
    values: platformRows.map((p) =>
      p.cited ? Math.max(p.share ?? 72, 40) : Math.max(p.share ?? 12, 8),
    ),
  };
}

export function buildPromptDoughnutSeries(rows: PromptRow[]) {
  const cited = rows.filter((r) => r.cited).length;
  const gaps = Math.max(0, rows.length - cited);
  if (rows.length === 0) {
    return {
      segments: [
        { label: "No prompts", value: 1, color: "#cbd5e1" },
      ],
      cited,
      gaps: 0,
    };
  }
  return {
    segments: [
      { label: "Cited", value: cited || 0.01, color: "#22c55e" },
      { label: "Gaps", value: gaps || 0.01, color: "#f59e0b" },
    ],
    cited,
    gaps,
  };
}

export function buildPromptRankingBars(rows: PromptRow[]) {
  const sorted = [...rows]
    .sort((a, b) => (b.visibility ?? 0) - (a.visibility ?? 0))
    .slice(0, 8);
  return sorted.map((row, i) => ({
    label: row.prompt.length > 28 ? `${row.prompt.slice(0, 28)}…` : row.prompt,
    value: row.visibility ?? (row.cited ? 100 : 0),
    color: row.cited ? CHART_PALETTE[i % CHART_PALETTE.length] : CHART_PALETTE[5],
  }));
}

export function buildPromptBubblePoints(rows: PromptRow[]): BubblePoint[] {
  return rows.slice(0, 12).map((row, index) => ({
    x: index + 1,
    y: row.visibility ?? (row.cited ? 100 : 12),
    r: Math.max(6, Math.min(18, 6 + row.models.length * 3)),
    label: row.prompt.length > 40 ? `${row.prompt.slice(0, 40)}…` : row.prompt,
  }));
}

export function buildPolarPlatformSegments(workspace: WorkspaceSnapshot) {
  const platformRows = platformRowsFromWorkspace(workspace, PLATFORMS).slice(0, 6);
  return platformRows.map((p, i) => ({
    label: p.name.split(" ")[0] ?? p.name,
    value: p.cited ? Math.max(p.share ?? 30, 15) : 4,
    color: CHART_PALETTE[i % CHART_PALETTE.length],
  }));
}

export function analyticsKpis(workspace: WorkspaceSnapshot, rows: PromptRow[]) {
  const platformRows = platformRowsFromWorkspace(workspace, PLATFORMS);
  const citedPlatforms = platformRows.filter((p) => p.cited).length;
  const citedPrompts = rows.filter((r) => r.cited).length;

  return {
    citationScore: workspace.citationScore,
    visibilityScore: workspace.visibilityScore,
    citedPlatforms,
    totalPlatforms: platformRows.length,
    citedPrompts,
    totalPrompts: rows.length || workspace.promptsTracked,
    hasRealAudit: workspace.hasRealAudit,
  };
}
