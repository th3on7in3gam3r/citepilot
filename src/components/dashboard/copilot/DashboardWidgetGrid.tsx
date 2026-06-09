"use client";

import { useMemo } from "react";
import { DashboardCard } from "@/components/dashboard/layout/DashboardCard";
import { WidgetVisualization } from "@/components/dashboard/copilot/WidgetVisualization";
import { useCopilot } from "@/components/dashboard/copilot/CopilotProvider";
import {
  resolveWidgetData,
  widgetDataAvailable,
} from "@/lib/copilot/widget-data";
import { useGscMetrics } from "@/hooks/useGscMetrics";
import {
  widgetRequiresGsc,
  widgetSourceStatus,
} from "@/lib/dashboard-data-status";
import type { WorkspaceSnapshot } from "@/lib/dashboard";

export function DashboardWidgetGrid({ workspace }: { workspace: WorkspaceSnapshot }) {
  const { widgets, selectedWidgetId, selectWidget, clearHighlight, openCopilot, removeWidget } =
    useCopilot();
  const workspaceId = workspace.workspaceId ?? workspace.id;
  const { metrics: gsc, connected: gscConnected } = useGscMetrics(workspaceId);

  const sorted = useMemo(
    () => [...widgets].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [widgets],
  );

  const visible = useMemo(
    () =>
      sorted.filter((widget) => {
        if (widgetRequiresGsc(widget.source) && !gscConnected) return false;
        const data = resolveWidgetData(workspace, widget, { gsc });
        return widgetDataAvailable(data);
      }),
    [sorted, gscConnected, workspace, gsc],
  );

  if (visible.length === 0) return null;

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {visible.map((widget) => {
        const data = resolveWidgetData(workspace, widget, { gsc });
        const highlighted = widget.highlighted;
        const selected = selectedWidgetId === widget.id;
        const status = widgetSourceStatus(widget.source, workspace, gsc);

        return (
          <div
            key={widget.id}
            className={`relative transition ${
              highlighted || selected
                ? "rounded-2xl ring-2 ring-[#0ea5e9] ring-offset-2"
                : ""
            }`}
            onClick={() => {
              selectWidget(widget.id);
              if (highlighted) clearHighlight(widget.id);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") selectWidget(widget.id);
            }}
            role="button"
            tabIndex={0}
          >
            <DashboardCard title={widget.name} dataStatus={status} className="h-full cursor-pointer">
              <div className="absolute top-3 right-3 flex gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openCopilot();
                    selectWidget(widget.id);
                  }}
                  className="rounded-lg p-1.5 text-[#94a3b8] hover:bg-[#f8fafb] hover:text-[#0f172a]"
                  aria-label="Expand widget"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeWidget(widget.id);
                  }}
                  className="rounded-lg p-1.5 text-[#94a3b8] hover:bg-red-50 hover:text-red-600"
                  aria-label="Remove widget"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <WidgetVisualization widget={widget} data={data} />
            </DashboardCard>
          </div>
        );
      })}
    </div>
  );
}
