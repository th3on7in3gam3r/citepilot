import type { CitationHistoryPoint } from "@/lib/api-types";
import type { WorkspaceSnapshot } from "@/lib/dashboard";
import { promptRowsForWorkspace } from "@/lib/dashboard-data";
import type { PromptRow } from "@/lib/features";

export type DashboardPeriod = "7d" | "28d" | "90d";
export type DashboardPlatformFilter = "all" | "chatgpt" | "perplexity" | "google-ai" | "gemini";

export const DASHBOARD_PERIOD_OPTIONS: { value: DashboardPeriod; label: string }[] = [
  { value: "90d", label: "Last 90 days" },
  { value: "28d", label: "Last 28 days" },
  { value: "7d", label: "Last 7 days" },
];

export const DASHBOARD_PLATFORM_OPTIONS: { value: DashboardPlatformFilter; label: string }[] = [
  { value: "all", label: "All LLMs" },
  { value: "chatgpt", label: "ChatGPT" },
  { value: "perplexity", label: "Perplexity" },
  { value: "google-ai", label: "Google AI" },
  { value: "gemini", label: "Gemini" },
];

export function periodToDays(period: DashboardPeriod): number {
  switch (period) {
    case "7d":
      return 7;
    case "28d":
      return 28;
    case "90d":
    default:
      return 90;
  }
}

export function periodDisplayLabel(period: DashboardPeriod): string {
  return DASHBOARD_PERIOD_OPTIONS.find((o) => o.value === period)?.label ?? "Last 90 days";
}

function cutoffDate(period: DashboardPeriod): Date {
  const days = periodToDays(period);
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d;
}

export function filterHistoryByPeriod(
  history: CitationHistoryPoint[],
  period: DashboardPeriod,
): CitationHistoryPoint[] {
  if (history.length === 0) return history;
  const cutoff = cutoffDate(period);
  const filtered = history.filter((point) => {
    const parsed = new Date(point.recordedAt);
    return !Number.isNaN(parsed.getTime()) && parsed >= cutoff;
  });
  return filtered.length > 0 ? filtered : history.slice(-Math.min(3, history.length));
}

export function filterDailyByPeriod<T extends { date: string }>(
  daily: T[],
  period: DashboardPeriod,
): T[] {
  if (daily.length === 0) return daily;
  const cutoff = cutoffDate(period);
  const cutoffKey = cutoff.toISOString().slice(0, 10);
  const filtered = daily.filter((point) => point.date >= cutoffKey);
  return filtered.length > 0 ? filtered : daily.slice(-Math.min(7, daily.length));
}

function normalizePlatformKey(name: string): string {
  return name.toLowerCase().replace(/overviews/g, "").replace(/ai/g, "").replace(/\s+/g, "");
}

export function platformMatchesFilter(
  name: string,
  filter: DashboardPlatformFilter,
): boolean {
  if (filter === "all") return true;
  const key = normalizePlatformKey(name);
  switch (filter) {
    case "chatgpt":
      return key.includes("chatgpt") || key.includes("gpt");
    case "perplexity":
      return key.includes("perplexity");
    case "google-ai":
      return key.includes("google") || key.includes("overview");
    case "gemini":
      return key.includes("gemini");
    default:
      return true;
  }
}

export function filterPlatformRows<
  T extends { name: string; cited: boolean; share?: number },
>(rows: T[], filter: DashboardPlatformFilter): T[] {
  if (filter === "all") return rows;
  return rows.filter((row) => platformMatchesFilter(row.name, filter));
}

const MODEL_FILTER_ALIASES: Record<DashboardPlatformFilter, string[]> = {
  all: [],
  chatgpt: ["gpt", "chatgpt"],
  perplexity: ["perplexity"],
  "google-ai": ["google", "overview", "aio"],
  gemini: ["gemini"],
};

export function filterPromptRowsByPlatform(
  rows: PromptRow[],
  filter: DashboardPlatformFilter,
): PromptRow[] {
  if (filter === "all") return rows;
  const aliases = MODEL_FILTER_ALIASES[filter];
  return rows.filter((row) =>
    row.models.some((model) => {
      const m = model.toLowerCase();
      return aliases.some((alias) => m.includes(alias));
    }),
  );
}

export type KeywordOverlapSegment = {
  label: string;
  value: number;
  color: string;
};

export function buildKeywordOverlapSegments(
  workspace: WorkspaceSnapshot,
): KeywordOverlapSegment[] {
  const rows = promptRowsForWorkspace(workspace);
  if (rows.length === 0) return [];

  let youLead = 0;
  let contested = 0;
  let gaps = 0;

  for (const row of rows) {
    if (row.cited && row.leader === "You") youLead++;
    else if (row.cited) contested++;
    else gaps++;
  }

  return [
    { label: "You lead", value: youLead, color: "#6366f1" },
    { label: "Contested", value: contested, color: "#fbbf24" },
    { label: "Open gaps", value: gaps, color: "#f87171" },
  ].filter((segment) => segment.value > 0);
}
