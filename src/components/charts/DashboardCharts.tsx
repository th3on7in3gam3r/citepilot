"use client";

import {
  Bar,
  Bubble,
  Doughnut,
  Line,
  PolarArea,
  Radar,
} from "react-chartjs-2";
import type { ChartOptions } from "chart.js";
import { registerCharts } from "@/lib/charts/register";
import {
  CHART_COLORS,
  CHART_PALETTE,
  chartFill,
  chartFontFamily,
} from "@/lib/charts/theme";

registerCharts();

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  font: { family: chartFontFamily },
} satisfies Partial<ChartOptions>;

export function DashboardLineChart({
  labels,
  series,
  height = 120,
  fill = false,
  showLegend = false,
  yMax,
}: {
  labels: readonly string[];
  series: {
    label: string;
    values: number[];
    color?: string;
    dashed?: boolean;
    fill?: boolean;
  }[];
  height?: number;
  fill?: boolean;
  showLegend?: boolean;
  yMax?: number;
}) {
  return (
    <div style={{ height }} className="w-full">
      <Line
        data={{
          labels: [...labels],
          datasets: series.map((s, i) => {
            const color = s.color ?? CHART_PALETTE[i % CHART_PALETTE.length];
            const useFill = s.fill ?? fill;
            return {
              label: s.label,
              data: s.values,
              borderColor: color,
              backgroundColor: useFill ? chartFill(color) : "transparent",
              borderWidth: 2,
              borderDash: s.dashed ? [6, 4] : undefined,
              pointRadius: labels.length > 8 ? 0 : 3,
              pointHoverRadius: 4,
              pointBackgroundColor: "#fff",
              pointBorderColor: color,
              pointBorderWidth: 2,
              tension: 0.35,
              fill: useFill ? "origin" : false,
            };
          }),
        }}
        options={{
          ...baseOptions,
          plugins: {
            legend: {
              display: showLegend,
              position: "top",
              align: "end",
              labels: {
                boxWidth: 10,
                boxHeight: 10,
                color: CHART_COLORS.label,
                font: { size: 11, weight: 500 },
              },
            },
            tooltip: {
              backgroundColor: CHART_COLORS.ink,
              titleFont: { size: 12 },
              bodyFont: { size: 11 },
              padding: 10,
              cornerRadius: 8,
            },
          },
          scales: {
            x: {
              grid: { display: false },
              border: { display: false },
              ticks: {
                color: CHART_COLORS.muted,
                font: { size: 10 },
                maxRotation: 0,
                autoSkip: true,
                maxTicksLimit: 8,
              },
            },
            y: {
              max: yMax,
              grid: { color: CHART_COLORS.grid },
              border: { display: false },
              ticks: {
                color: CHART_COLORS.muted,
                font: { size: 10 },
                maxTicksLimit: 5,
              },
            },
          },
        }}
      />
    </div>
  );
}

export function DashboardBarChart({
  labels,
  series,
  height = 160,
  horizontal = false,
  stacked = false,
  showLegend = true,
}: {
  labels: readonly string[];
  series: { name: string; values: number[]; color?: string; colors?: string[] }[];
  height?: number;
  horizontal?: boolean;
  stacked?: boolean;
  showLegend?: boolean;
}) {
  const indexAxis = horizontal ? ("y" as const) : ("x" as const);

  return (
    <div style={{ height }} className="w-full">
      <Bar
        data={{
          labels: [...labels],
          datasets: series.map((s, i) => ({
            label: s.name,
            data: s.values,
            backgroundColor:
              s.colors ??
              (s.color ?? CHART_PALETTE[i % CHART_PALETTE.length]),
            borderRadius: horizontal ? { topRight: 4, bottomRight: 4 } : { topLeft: 4, topRight: 4 },
            borderSkipped: false,
            maxBarThickness: horizontal ? 14 : 36,
          })),
        }}
        options={{
          ...baseOptions,
          indexAxis,
          plugins: {
            legend: {
              display: showLegend && series.length > 1,
              position: "top",
              align: "end",
              labels: {
                boxWidth: 10,
                color: CHART_COLORS.label,
                font: { size: 11 },
              },
            },
            tooltip: {
              backgroundColor: CHART_COLORS.ink,
              cornerRadius: 8,
            },
          },
          scales: {
            x: {
              stacked,
              grid: { display: horizontal, color: CHART_COLORS.grid },
              border: { display: false },
              ticks: {
                color: CHART_COLORS.muted,
                font: { size: 10 },
                maxRotation: 0,
              },
            },
            y: {
              stacked,
              grid: { display: !horizontal, color: CHART_COLORS.grid },
              border: { display: false },
              ticks: {
                color: CHART_COLORS.muted,
                font: { size: 10 },
              },
              max: horizontal ? undefined : 100,
            },
          },
        }}
      />
    </div>
  );
}

export function DashboardDoughnutChart({
  segments,
  total,
  hollow = true,
  height = 144,
}: {
  segments: { label: string; value: number; color?: string }[];
  total?: number;
  hollow?: boolean;
  height?: number;
}) {
  const sum = total ?? (segments.reduce((s, x) => s + x.value, 0) || 1);

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
      <div className="relative" style={{ height, width: height }}>
        <Doughnut
          data={{
            labels: segments.map((s) => s.label),
            datasets: [
              {
                data: segments.map((s) => s.value),
                backgroundColor: segments.map(
                  (s, i) => s.color ?? CHART_PALETTE[i % CHART_PALETTE.length],
                ),
                borderWidth: 0,
                hoverOffset: 4,
              },
            ],
          }}
          options={{
            ...baseOptions,
            cutout: hollow ? "68%" : "0%",
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: CHART_COLORS.ink,
                callbacks: {
                  label: (ctx) => {
                    const v = ctx.parsed;
                    const pct = Math.round((v / sum) * 100);
                    return ` ${ctx.label}: ${pct}%`;
                  },
                },
              },
            },
          }}
        />
        {hollow && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-[#0f172a]">{sum}</span>
          </div>
        )}
      </div>
      <ul className="space-y-2 text-xs">
        {segments.map((seg, i) => (
          <li key={seg.label} className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: seg.color ?? CHART_PALETTE[i % CHART_PALETTE.length] }}
            />
            <span className="text-[#64748b]">{seg.label}</span>
            <span className="font-medium text-[#0f172a]">
              {Math.round((seg.value / sum) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DashboardGaugeChart({
  value,
  label,
  size = "md",
}: {
  value: number;
  label?: string;
  size?: "sm" | "md" | "lg";
}) {
  const pct = Math.min(100, Math.max(0, value));
  const h = size === "lg" ? 112 : size === "sm" ? 72 : 96;
  const w = size === "lg" ? 176 : size === "sm" ? 112 : 144;

  return (
    <div className="flex flex-col items-center py-1">
      <div className="relative" style={{ height: h, width: w }}>
        <Doughnut
          data={{
            datasets: [
              {
                data: [pct, 100 - pct],
                backgroundColor: [CHART_COLORS.primary, CHART_COLORS.grid],
                borderWidth: 0,
                borderRadius: 4,
              },
            ],
          }}
          options={{
            ...baseOptions,
            rotation: -90,
            circumference: 180,
            cutout: "72%",
            plugins: { legend: { display: false }, tooltip: { enabled: false } },
          }}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 text-center">
          <p
            className={`font-bold text-[#0f172a] ${size === "lg" ? "text-3xl" : size === "sm" ? "text-lg" : "text-2xl"}`}
          >
            {pct}%
          </p>
        </div>
      </div>
      {label && <p className="mt-1 text-xs text-[#64748b]">{label}</p>}
    </div>
  );
}

export function DashboardRingChart({
  value,
  label,
  max = 100,
}: {
  value: number;
  label: string;
  max?: number;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-16 w-16">
        <Doughnut
          data={{
            datasets: [
              {
                data: [pct, 100 - pct],
                backgroundColor: [CHART_COLORS.primary, CHART_COLORS.grid],
                borderWidth: 0,
              },
            ],
          }}
          options={{
            ...baseOptions,
            cutout: "78%",
            plugins: { legend: { display: false }, tooltip: { enabled: false } },
          }}
        />
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-bold text-[#0f172a]">
          {value}
        </span>
      </div>
      <span className="text-[11px] font-medium text-[#64748b]">{label}</span>
    </div>
  );
}

export function DashboardSparkline({
  values,
  color = CHART_COLORS.primary,
  className = "mt-2 h-6 w-16",
}: {
  values: number[];
  color?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <Line
        data={{
          labels: values.map((_, i) => i),
          datasets: [
            {
              data: values,
              borderColor: color,
              backgroundColor: "transparent",
              borderWidth: 2,
              pointRadius: 0,
              tension: 0.4,
              fill: false,
            },
          ],
        }}
        options={{
          ...baseOptions,
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          scales: {
            x: { display: false },
            y: { display: false },
          },
        }}
      />
    </div>
  );
}

export function DashboardRadarChart({
  labels,
  values,
  height = 260,
  color = CHART_COLORS.primary,
}: {
  labels: readonly string[];
  values: number[];
  height?: number;
  color?: string;
}) {
  return (
    <div style={{ height }} className="w-full">
      <Radar
        data={{
          labels: [...labels],
          datasets: [
            {
              label: "Coverage",
              data: values,
              borderColor: color,
              backgroundColor: chartFill(color, 0.28),
              borderWidth: 2,
              pointBackgroundColor: color,
              pointBorderColor: "#fff",
              pointBorderWidth: 2,
              pointRadius: 3,
            },
          ],
        }}
        options={{
          ...baseOptions,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: CHART_COLORS.ink,
              cornerRadius: 8,
            },
          },
          scales: {
            r: {
              min: 0,
              max: 100,
              ticks: {
                stepSize: 25,
                color: CHART_COLORS.muted,
                font: { size: 9 },
                backdropColor: "transparent",
              },
              grid: { color: CHART_COLORS.grid },
              angleLines: { color: CHART_COLORS.grid },
              pointLabels: {
                color: CHART_COLORS.label,
                font: { size: 10, weight: 600 },
              },
            },
          },
        }}
      />
    </div>
  );
}

export function DashboardPolarAreaChart({
  segments,
  height = 260,
}: {
  segments: { label: string; value: number; color?: string }[];
  height?: number;
}) {
  return (
    <div style={{ height }} className="w-full">
      <PolarArea
        data={{
          labels: segments.map((s) => s.label),
          datasets: [
            {
              data: segments.map((s) => s.value),
              backgroundColor: segments.map(
                (s, i) => chartFill(s.color ?? CHART_PALETTE[i % CHART_PALETTE.length], 0.55),
              ),
              borderColor: segments.map(
                (s, i) => s.color ?? CHART_PALETTE[i % CHART_PALETTE.length],
              ),
              borderWidth: 1,
            },
          ],
        }}
        options={{
          ...baseOptions,
          plugins: {
            legend: {
              display: true,
              position: "bottom",
              labels: {
                boxWidth: 8,
                color: CHART_COLORS.label,
                font: { size: 10 },
              },
            },
            tooltip: {
              backgroundColor: CHART_COLORS.ink,
              cornerRadius: 8,
            },
          },
          scales: {
            r: {
              grid: { color: CHART_COLORS.grid },
              ticks: { display: false },
            },
          },
        }}
      />
    </div>
  );
}

export type BubblePoint = {
  x: number;
  y: number;
  r: number;
  label?: string;
};

export function DashboardBubbleChart({
  points,
  height = 260,
  color = CHART_COLORS.violet,
}: {
  points: BubblePoint[];
  height?: number;
  color?: string;
}) {
  return (
    <div style={{ height }} className="w-full">
      <Bubble
        data={{
          datasets: [
            {
              label: "Prompts",
              data: points,
              backgroundColor: chartFill(color, 0.45),
              borderColor: color,
              borderWidth: 1.5,
            },
          ],
        }}
        options={{
          ...baseOptions,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: CHART_COLORS.ink,
              cornerRadius: 8,
              callbacks: {
                label: (ctx) => {
                  const raw = ctx.raw as BubblePoint & { label?: string };
                  const name = raw.label ?? `Prompt ${ctx.dataIndex + 1}`;
                  return ` ${name}: ${raw.y}% visibility`;
                },
              },
            },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Prompt index",
                color: CHART_COLORS.muted,
                font: { size: 10 },
              },
              grid: { color: CHART_COLORS.grid },
              border: { display: false },
              ticks: { color: CHART_COLORS.muted, font: { size: 10 } },
            },
            y: {
              min: 0,
              max: 100,
              title: {
                display: true,
                text: "Visibility %",
                color: CHART_COLORS.muted,
                font: { size: 10 },
              },
              grid: { color: CHART_COLORS.grid },
              border: { display: false },
              ticks: { color: CHART_COLORS.muted, font: { size: 10 } },
            },
          },
        }}
      />
    </div>
  );
}
