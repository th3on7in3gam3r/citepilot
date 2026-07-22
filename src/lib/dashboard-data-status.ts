import type { WorkspaceSnapshot } from "@/lib/dashboard";
import type { GscMetrics } from "@/lib/gsc/client";
import type { WidgetDataSource } from "@/lib/copilot/widgets";

export type DataStatus = "live" | "estimated" | "demo";

export const DATA_STATUS_LABEL: Record<DataStatus, string> = {
  live: "Live",
  estimated: "Estimated",
  demo: "Demo",
};

const GSC_SOURCES: WidgetDataSource[] = [
  "google-analytics",
  "search-console",
  "traffic",
];

export function isGscWidgetSource(source: WidgetDataSource): boolean {
  return GSC_SOURCES.includes(source);
}

export function gscIsLive(gsc: GscMetrics | null | undefined): boolean {
  return Boolean(gsc?.connected);
}

export function citationTrendStatus(workspace: WorkspaceSnapshot): DataStatus {
  const history = workspace.citationHistory ?? [];
  if (history.length >= 2) return "live";
  if (workspace.hasRealAudit) return "estimated";
  return "demo";
}

/** Measured audit fields only — derived/fillers stay estimated. */
export function auditStatus(workspace: WorkspaceSnapshot): DataStatus {
  if (!workspace.hasRealAudit) return "demo";
  return "live";
}

export function platformCoverageStatus(workspace: WorkspaceSnapshot): DataStatus {
  if (!workspace.hasRealAudit) return "demo";
  const rows = workspace.platformPresence ?? [];
  const hasShare = rows.some((p) => typeof p.share === "number");
  return hasShare ? "live" : "estimated";
}

export function widgetSourceStatus(
  source: WidgetDataSource,
  workspace: WorkspaceSnapshot,
  gsc: GscMetrics | null | undefined,
): DataStatus {
  if (isGscWidgetSource(source)) {
    return gscIsLive(gsc) ? "live" : "demo";
  }

  switch (source) {
    case "citations":
    case "visibility":
    case "platforms":
      return workspace.hasRealAudit ? "live" : "demo";
    case "backlinks":
      return workspace.hasRealAudit && workspace.sourceCount > 0 ? "live" : "estimated";
    case "keywords":
    case "competitors":
      return workspace.hasRealAudit && (workspace.promptResults?.length ?? 0) > 0
        ? "live"
        : workspace.hasRealAudit
          ? "estimated"
          : "demo";
    default:
      return workspace.hasRealAudit ? "estimated" : "demo";
  }
}

export function widgetRequiresGsc(source: WidgetDataSource): boolean {
  return isGscWidgetSource(source);
}
