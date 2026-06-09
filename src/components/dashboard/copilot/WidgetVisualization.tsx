"use client";

import {
  DashboardBarChart,
  DashboardDoughnutChart,
  DashboardGaugeChart,
  DashboardLineChart,
} from "@/components/charts/DashboardCharts";
import type { ResolvedWidgetData } from "@/lib/copilot/widget-data";
import type { DashboardWidget } from "@/lib/copilot/widgets";
import { CHART_COLORS } from "@/lib/charts/theme";

export function WidgetVisualization({
  widget,
  data,
}: {
  widget: DashboardWidget;
  data: ResolvedWidgetData;
}) {
  switch (data.kind) {
    case "unavailable":
      return (
        <p className="py-6 text-center text-sm text-[#64748b]">{data.reason}</p>
      );

    case "segments":
      if (widget.chartType === "bars") {
        return (
          <DashboardBarChart
            horizontal
            height={140}
            showLegend={false}
            labels={data.segments.map((s) => s.label)}
            series={[
              {
                name: widget.name,
                values: data.segments.map((s) => s.value),
                color: CHART_COLORS.primary,
              },
            ]}
          />
        );
      }
      return (
        <DashboardDoughnutChart
          segments={data.segments}
          total={data.total}
          hollow={widget.chartType === "donut" || widget.chartType === "pie"}
        />
      );

    case "series":
      if (widget.chartType === "bars") {
        return (
          <DashboardBarChart
            labels={data.labels}
            series={data.series}
            height={160}
          />
        );
      }
      return (
        <DashboardLineChart
          labels={data.labels}
          series={data.series.map((s) => ({
            label: s.name,
            values: s.values,
            color: s.color,
          }))}
          height={144}
          fill={widget.chartType === "area"}
          showLegend={data.series.length > 1}
        />
      );

    case "table":
      return (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[280px] text-left text-xs">
            <thead>
              <tr className="border-b border-[#eef2f6] text-[#64748b]">
                {data.columns.map((col) => (
                  <th key={col} className="pb-2 pr-3 font-medium">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, i) => (
                <tr key={i} className="border-b border-[#f8fafb]">
                  {row.map((cell, j) => (
                    <td key={j} className="py-2.5 pr-3 text-[#334155]">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "gauge":
      return <DashboardGaugeChart value={data.value} label={data.label} />;

    case "kpi":
      return (
        <div className="py-4 text-center">
          <p className="text-3xl font-bold text-[#0f172a]">{data.value}</p>
          {data.delta && (
            <p className="mt-1 text-sm font-medium text-[#0ea5e9]">{data.delta}</p>
          )}
          {data.sublabel && (
            <p className="mt-1 text-xs text-[#64748b]">{data.sublabel}</p>
          )}
        </div>
      );
  }
}
