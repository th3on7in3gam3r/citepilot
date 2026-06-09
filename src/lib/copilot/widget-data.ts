import type { WorkspaceSnapshot } from "@/lib/dashboard";
import { PLATFORMS } from "@/lib/dashboard";
import {
  platformRowsFromWorkspace,
  promptRowsForWorkspace,
} from "@/lib/dashboard-data";
import type { GscMetrics } from "@/lib/gsc/client";
import { gscIsLive } from "@/lib/dashboard-data-status";
import type { DashboardWidget, WidgetDataSource } from "@/lib/copilot/widgets";

export type WidgetSegment = { label: string; value: number; color?: string };
export type WidgetSeries = { name: string; values: number[]; color?: string };

export type ResolvedWidgetData =
  | { kind: "segments"; segments: WidgetSegment[]; total?: number }
  | { kind: "series"; labels: string[]; series: WidgetSeries[] }
  | { kind: "table"; columns: string[]; rows: (string | number)[][] }
  | { kind: "gauge"; value: number; label?: string }
  | { kind: "kpi"; value: string; delta?: string; sublabel?: string }
  | { kind: "unavailable"; reason: string };

export type WidgetDataContext = {
  gsc?: GscMetrics | null;
};

const COLORS = ["#0ea5e9", "#38bdf8", "#a78bfa", "#14b8a6", "#fbbf24", "#94a3b8"];

function dateLabels(count = 6): string[] {
  const labels: string[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 3);
    labels.push(
      d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    );
  }
  return labels;
}

function formatGscDate(date: string): string {
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function historyValues(workspace: WorkspaceSnapshot): number[] {
  const history = workspace.citationHistory ?? [];
  if (history.length > 0) {
    return history.map((h) => Math.round(h.visibilityIndex));
  }
  const score = workspace.citationScore;
  return [score - 8, score - 4, score - 2, score, score + 1, score + 2];
}

function historyLabels(workspace: WorkspaceSnapshot): string[] {
  const history = workspace.citationHistory ?? [];
  if (history.length > 0) {
    return history.map((point, index, all) => {
      const parsed = new Date(point.recordedAt);
      if (Number.isNaN(parsed.getTime())) return `Audit ${index + 1}`;
      return parsed.toLocaleDateString("en-US", {
        month: "short",
        day: all.length <= 6 ? "numeric" : undefined,
      });
    });
  }
  return dateLabels(6);
}

function gscUnavailable(): ResolvedWidgetData {
  return {
    kind: "unavailable",
    reason: "Connect Google Search Console to load this widget.",
  };
}

export function widgetDataAvailable(data: ResolvedWidgetData): boolean {
  return data.kind !== "unavailable";
}

export function resolveWidgetData(
  workspace: WorkspaceSnapshot,
  widget: DashboardWidget,
  context: WidgetDataContext = {},
): ResolvedWidgetData {
  return resolveBySource(workspace, widget.source, widget, context);
}

function resolveBySource(
  workspace: WorkspaceSnapshot,
  source: WidgetDataSource,
  widget: DashboardWidget,
  context: WidgetDataContext,
): ResolvedWidgetData {
  const gsc = context.gsc;
  const platformRows = platformRowsFromWorkspace(workspace, PLATFORMS);
  const promptRows = promptRowsForWorkspace(workspace);
  const citedCount = platformRows.filter((p) => p.cited).length;
  const history = historyValues(workspace);
  const histLabels = historyLabels(workspace);

  switch (source) {
    case "traffic": {
      if (!gscIsLive(gsc)) return gscUnavailable();

      const daily = gsc!.daily ?? [];
      if (
        widget.chartType === "bars" ||
        widget.chartType === "line" ||
        widget.chartType === "area"
      ) {
        const labels = daily.map((d) => formatGscDate(d.date));
        return {
          kind: "series",
          labels,
          series: [
            {
              name: "Clicks",
              values: daily.map((d) => d.clicks),
              color: COLORS[0],
            },
            {
              name: "Impressions",
              values: daily.map((d) => d.impressions),
              color: COLORS[1],
            },
          ],
        };
      }

      return {
        kind: "segments",
        total: gsc!.clicks + gsc!.impressions,
        segments: [
          { label: "Clicks (28d)", value: gsc!.clicks, color: COLORS[0] },
          { label: "Impressions (28d)", value: gsc!.impressions, color: COLORS[1] },
        ],
      };
    }

    case "platforms": {
      const segments = platformRows.slice(0, 6).map((p, i) => ({
        label: p.name,
        value: p.cited ? Math.round((p.share ?? 70) * 10) : Math.round(10 + i * 3),
        color: p.cited ? COLORS[0] : COLORS[5],
      }));
      return { kind: "segments", segments, total: segments.reduce((s, x) => s + x.value, 0) };
    }

    case "keywords": {
      const rows = (promptRows.length ? promptRows : [{ prompt: workspace.buyerQuestion, cited: false, leader: "—" }])
        .slice(0, 6)
        .map((r) => [
          r.prompt.length > 36 ? `${r.prompt.slice(0, 36)}…` : r.prompt,
          workspace.hasRealAudit ? "—" : `${Math.round(80 + r.prompt.length * 900)}K`,
          r.cited ? "Cited" : "Gap",
          r.leader ?? "—",
        ]);
      return {
        kind: "table",
        columns: ["Prompt", "Volume", "Status", "Leader"],
        rows,
      };
    }

    case "competitors": {
      const comps = workspace.competitors.length
        ? workspace.competitors
        : ["competitor-a.com", "competitor-b.io"];
      return {
        kind: "table",
        columns: ["Domain", "Share of voice", "Citations", "Trend"],
        rows: comps.slice(0, 5).map((c, i) => [
          c,
          workspace.hasRealAudit ? `${Math.max(5, 40 - i * 8)}%` : "—",
          String(Math.max(1, citedCount - i)),
          i === 0 ? "↑" : "→",
        ]),
      };
    }

    case "visibility":
    case "citations": {
      if (widget.chartType === "gauge") {
        return {
          kind: "gauge",
          value: workspace.citationScore,
          label: "Citation health",
        };
      }
      return {
        kind: "series",
        labels: histLabels.slice(0, history.length),
        series: [
          {
            name: "Visibility",
            values: history,
            color: "#38bdf8",
          },
        ],
      };
    }

    case "search-console": {
      if (!gscIsLive(gsc)) return gscUnavailable();

      if (widget.chartType === "line" || widget.chartType === "area") {
        const daily = gsc!.daily ?? [];
        return {
          kind: "series",
          labels: daily.map((d) => formatGscDate(d.date)),
          series: [
            {
              name: "Impressions",
              values: daily.map((d) => d.impressions),
              color: COLORS[1],
            },
            {
              name: "Clicks",
              values: daily.map((d) => d.clicks),
              color: COLORS[0],
            },
          ],
        };
      }

      return {
        kind: "table",
        columns: ["Metric", "Last 28 days", "Change"],
        rows: [
          ["Clicks", gsc!.clicks.toLocaleString(), gsc!.clicksDelta ?? "—"],
          ["Impressions", gsc!.impressions.toLocaleString(), gsc!.impressionsDelta ?? "—"],
          ["CTR", `${(gsc!.ctr * 100).toFixed(2)}%`, "—"],
          ["Avg position", gsc!.position.toFixed(1), "—"],
        ],
      };
    }

    case "backlinks": {
      const total = Math.max(workspace.sourceCount, 10);
      return {
        kind: "segments",
        segments: [
          { label: "dofollow", value: Math.round(total * 0.62), color: COLORS[0] },
          { label: "nofollow", value: Math.round(total * 0.28), color: COLORS[1] },
          { label: "sponsored", value: Math.round(total * 0.1), color: COLORS[4] },
        ],
      };
    }

    case "google-analytics":
    default: {
      if (!gscIsLive(gsc)) return gscUnavailable();

      return {
        kind: "kpi",
        value: gsc!.clicks.toLocaleString(),
        delta: gsc!.clicksDelta ?? undefined,
        sublabel: "Organic clicks (28d)",
      };
    }
  }
}

export function formatWidgetValue(value: number, unit: DashboardWidget["unit"]): string {
  if (unit === "percent") return `${value.toFixed(1)}%`;
  if (unit === "currency") return `$${value.toLocaleString()}`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}
