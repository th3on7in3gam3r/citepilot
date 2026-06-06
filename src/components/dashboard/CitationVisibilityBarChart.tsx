"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  buildPlatformVisibilityBars,
  type PlatformVisibilityBar,
} from "@/lib/chart-data";

const W = 720;
const H = 260;
const PAD = { top: 20, right: 12, bottom: 44, left: 40 };

type CitationVisibilityBarChartProps = {
  platformRows: { name: string; cited: boolean; share?: number }[];
  hasRealAudit: boolean;
  domain: string;
  compact?: boolean;
};

export function CitationVisibilityBarChart({
  platformRows,
  hasRealAudit,
  domain,
  compact = false,
}: CitationVisibilityBarChartProps) {
  const bars = useMemo(
    () => buildPlatformVisibilityBars(platformRows),
    [platformRows],
  );

  const yMax = 100;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const barGap = 10;
  const barWidth = Math.max(
    18,
    (innerW - barGap * (bars.length - 1)) / Math.max(bars.length, 1),
  );
  const citedCount = bars.filter((b) => b.cited).length;

  if (!hasRealAudit) {
    return (
      <div
        className={`overflow-hidden rounded-2xl border border-dashed border-border bg-surface/40 ${
          compact ? "p-4" : "p-6 md:p-8"
        }`}
      >
        <h2 className="font-display text-lg font-bold text-ink md:text-xl">
          Citation visibility
        </h2>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Run a citation audit on {domain} to see per-platform visibility bars for
          ChatGPT, Perplexity, Google AI Overviews, and other answer surfaces.
        </p>
        {!compact && (
          <Link
            href="/audit"
            className="mt-4 inline-flex rounded-full bg-gradient-to-r from-[#7b93f0] via-[#6b8cff] to-accent px-5 py-2.5 text-sm font-semibold text-white"
          >
            Run citation audit
          </Link>
        )}
      </div>
    );
  }

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] ${
        compact ? "p-4" : "p-6 md:p-8"
      }`}
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-ink md:text-xl">
            Citation visibility
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Estimated share of model on your monitored prompts — by AI answer
            surface from your latest audit.
          </p>
        </div>
        <div className="mt-2 rounded-full border border-mint/30 bg-mint/10 px-3 py-1 text-xs font-semibold text-mint sm:mt-0">
          {citedCount}/{bars.length} platforms citing you
        </div>
      </div>

      <div className="mt-6">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full"
          role="img"
          aria-label="Citation visibility by AI platform bar chart"
        >
          <title>Citation visibility by platform for {domain}</title>
          {yTicks(yMax).map((tick) => {
            const y =
              PAD.top + innerH - (tick / yMax) * innerH;
            return (
              <g key={tick}>
                <line
                  x1={PAD.left}
                  y1={y}
                  x2={W - PAD.right}
                  y2={y}
                  stroke="#e8edf3"
                  strokeWidth={1}
                />
                <text
                  x={PAD.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-muted text-[11px]"
                >
                  {tick}%
                </text>
              </g>
            );
          })}

          {bars.map((bar, i) => (
            <BarColumn
              key={bar.id}
              bar={bar}
              index={i}
              barWidth={barWidth}
              barGap={barGap}
              yMax={yMax}
            />
          ))}
        </svg>
      </div>

      {!compact && (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {bars.map((bar) => (
            <li
              key={`legend-${bar.id}`}
              className="flex items-center gap-2 rounded-lg bg-surface/80 px-3 py-2 text-xs"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: bar.cited ? bar.color : "#cbd5e1" }}
                aria-hidden
              />
              <span className="font-medium text-ink">{bar.label}</span>
              <span className="ml-auto font-semibold tabular-nums text-muted">
                {bar.value}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function yTicks(max: number): number[] {
  const step = max <= 100 ? 25 : Math.ceil(max / 4 / 25) * 25;
  const ticks: number[] = [];
  for (let v = 0; v <= max; v += step) ticks.push(v);
  return ticks;
}

function BarColumn({
  bar,
  index,
  barWidth,
  barGap,
  yMax,
}: {
  bar: PlatformVisibilityBar;
  index: number;
  barWidth: number;
  barGap: number;
  yMax: number;
}) {
  const innerH = H - PAD.top - PAD.bottom;
  const x = PAD.left + index * (barWidth + barGap);
  const height = (bar.value / yMax) * innerH;
  const y = PAD.top + innerH - height;
  const fill = bar.cited ? bar.color : "#e2e8f0";
  const opacity = bar.cited ? 0.92 : 0.55;

  return (
    <g>
      <rect
        x={x}
        y={PAD.top}
        width={barWidth}
        height={innerH}
        rx={6}
        fill="#f8fafc"
      />
      <rect
        x={x}
        y={y}
        width={barWidth}
        height={Math.max(height, bar.cited ? 4 : 0)}
        rx={6}
        fill={fill}
        fillOpacity={opacity}
      >
        <title>
          {bar.label}: {bar.value}% visibility
        </title>
      </rect>
      <text
        x={x + barWidth / 2}
        y={H - 22}
        textAnchor="middle"
        className="fill-ink text-[10px] font-semibold"
      >
        {bar.shortLabel}
      </text>
      {bar.value > 0 && (
        <text
          x={x + barWidth / 2}
          y={y - 6}
          textAnchor="middle"
          className="fill-muted text-[10px] font-semibold"
        >
          {bar.value}%
        </text>
      )}
    </g>
  );
}
