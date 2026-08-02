"use client";

/**
 * RosenLineChart — Professional Rosen Charts-inspired SVG line chart.
 * Features:
 * - Smooth cubic-bezier curves (Catmull-Rom spline interpolation)
 * - Gradient area fill beneath the line
 * - Dashed grid lines with proper Y-axis labels
 * - Hover tooltip with vertical indicator
 * - Zero external dependencies
 */

import { useState } from "react";

// ─── Catmull-Rom spline → cubic bezier conversion ────────────────────────────
function smoothCurvePath(pts: { x: number; y: number }[], tension = 0.35): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M${pts[0].x},${pts[0].y}`;
  if (pts.length === 2) return `M${pts[0].x},${pts[0].y} L${pts[1].x},${pts[1].y}`;

  let d = `M${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`;

  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    d += ` C${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }

  return d;
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Series {
  label: string;
  values: number[];
  gradientFrom?: string;
  gradientTo?: string;
  color?: string;
}

interface TooltipState {
  visible: boolean;
  pct: number;
  index: number;
  data: { label: string; value: number; color: string }[];
}

// ─── Default palette ──────────────────────────────────────────────────────────
const PALETTES = [
  { from: "#6366f1", to: "#a78bfa", area: "rgba(99,102,241,0.12)" },
  { from: "#0ea5e9", to: "#38bdf8", area: "rgba(14,165,233,0.10)" },
  { from: "#10b981", to: "#34d399", area: "rgba(16,185,129,0.10)" },
];

const Y_TICK_COUNT = 4;

// ─── Component ────────────────────────────────────────────────────────────────
export function RosenLineChart({
  labels,
  series,
  height = 160,
  className = "",
}: {
  labels: readonly string[];
  series: Series[];
  height?: number;
  className?: string;
}) {
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    pct: 0,
    index: 0,
    data: [],
  });

  if (!series.length || !labels.length || !series[0].values.length) return null;

  const n = labels.length;
  const allValues = series.flatMap((s) => s.values.slice(0, n));

  // Expand the Y range slightly so the line doesn't hug the edges
  const rawMin = Math.min(...allValues);
  const rawMax = Math.max(...allValues);
  const rawRange = rawMax - rawMin || 1;
  const padding = rawRange * 0.2;
  const yMin = Math.max(0, rawMin - padding);
  const yMax = rawMax + padding;
  const yRange = yMax - yMin;

  // Y-axis nice ticks
  const yStep = yRange / Y_TICK_COUNT;
  const yTicks = Array.from({ length: Y_TICK_COUNT + 1 }, (_, i) => yMin + yStep * i);

  // Convert a data value to SVG % (0 = top, 100 = bottom)
  const toSvgY = (v: number) => 100 - ((v - yMin) / yRange) * 100;
  const toSvgX = (i: number) => (n === 1 ? 50 : (i / (n - 1)) * 100);

  // Which x-axis labels to show
  const xLabelIndices = new Set<number>([0, n - 1]);
  if (n > 4) xLabelIndices.add(Math.floor(n / 2));
  if (n > 8) {
    xLabelIndices.add(Math.floor(n / 4));
    xLabelIndices.add(Math.floor((3 * n) / 4));
  }

  function handleHover(idx: number) {
    setTooltip({
      visible: true,
      pct: toSvgX(idx),
      index: idx,
      data: series.map((s, si) => {
        const palette = PALETTES[si % PALETTES.length];
        return {
          label: s.label,
          value: s.values[idx] ?? 0,
          color: s.color ?? palette.from,
        };
      }),
    });
  }

  // Layout constants (pixels)
  const ML = 36; // margin-left for y-axis
  const MR = 8;  // margin-right
  const MT = 8;  // margin-top
  const MB = 24; // margin-bottom for x-axis

  return (
    <div
      className={`relative w-full select-none ${className}`}
      style={{ height }}
    >
      {/* ── Y-axis labels ─────────────────────────────── */}
      <div
        className="pointer-events-none absolute top-0 flex flex-col justify-between"
        style={{ left: 0, width: ML - 4, top: MT, bottom: MB }}
      >
        {[...yTicks].reverse().map((v, i) => (
          <span
            key={i}
            className="block text-right text-[9px] tabular-nums leading-none text-slate-400"
          >
            {Math.round(v)}
          </span>
        ))}
      </div>

      {/* ── SVG chart area ────────────────────────────── */}
      <svg
        className="absolute overflow-visible"
        style={{ left: ML, right: MR, top: MT, bottom: MB }}
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          {series.map((s, si) => {
            const palette = PALETTES[si % PALETTES.length];
            const from = s.gradientFrom ?? s.color ?? palette.from;
            const to = s.gradientTo ?? palette.to;
            return (
              <linearGradient key={`lg-${si}`} id={`rcl-stroke-${si}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={from} />
                <stop offset="100%" stopColor={to} />
              </linearGradient>
            );
          })}
          {series.map((s, si) => {
            const palette = PALETTES[si % PALETTES.length];
            const from = s.gradientFrom ?? s.color ?? palette.from;
            return (
              <linearGradient key={`area-${si}`} id={`rcl-area-${si}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={from} stopOpacity="0.18" />
                <stop offset="85%" stopColor={from} stopOpacity="0.02" />
                <stop offset="100%" stopColor={from} stopOpacity="0" />
              </linearGradient>
            );
          })}
        </defs>

        {/* Horizontal dashed grid lines */}
        {yTicks.map((v, i) => {
          const y = toSvgY(v);
          return (
            <line
              key={`grid-${i}`}
              x1="0" x2="100"
              y1={y} y2={y}
              stroke="currentColor"
              strokeDasharray="4,4"
              strokeWidth="0.4"
              vectorEffect="non-scaling-stroke"
              className="text-slate-200"
            />
          );
        })}

        {/* Area fills + line strokes */}
        {series.map((s, si) => {
          const pts = s.values.slice(0, n).map((v, i) => ({
            x: toSvgX(i),
            y: toSvgY(v),
          }));
          const linePath = smoothCurvePath(pts);
          // Area path: follow the line then close along the bottom
          const areaPath = `${linePath} L${pts[pts.length - 1].x},100 L${pts[0].x},100 Z`;

          return (
            <g key={si}>
              {/* Gradient fill */}
              <path
                d={areaPath}
                fill={`url(#rcl-area-${si})`}
              />
              {/* Smooth line */}
              <path
                d={linePath}
                fill="none"
                stroke={`url(#rcl-stroke-${si})`}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
              {/* Dot at last point */}
              {pts.length > 0 && (() => {
                const last = pts[pts.length - 1];
                const palette = PALETTES[si % PALETTES.length];
                const c = s.gradientFrom ?? s.color ?? palette.from;
                return (
                  <circle
                    cx={last.x} cy={last.y} r="2.5"
                    fill="white"
                    stroke={c}
                    strokeWidth="1.5"
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })()}
            </g>
          );
        })}

        {/* Vertical hover indicator */}
        {tooltip.visible && (
          <line
            x1={tooltip.pct} x2={tooltip.pct}
            y1="0" y2="100"
            stroke="currentColor"
            strokeWidth="0.8"
            strokeDasharray="3,2"
            vectorEffect="non-scaling-stroke"
            className="text-slate-300"
            style={{ pointerEvents: "none" }}
          />
        )}

        {/* Invisible hover target rects */}
        {Array.from({ length: n }, (_, i) => {
          const x = toSvgX(i);
          const slotW = n > 1 ? 100 / (n - 1) : 100;
          return (
            <rect
              key={i}
              x={Math.max(0, x - slotW / 2)}
              y={0}
              width={slotW}
              height={100}
              fill="transparent"
              onMouseEnter={() => handleHover(i)}
              onMouseLeave={() => setTooltip((t) => ({ ...t, visible: false }))}
              style={{ cursor: "crosshair" }}
            />
          );
        })}
      </svg>

      {/* ── X-axis labels ─────────────────────────────── */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 flex"
        style={{ paddingLeft: ML, paddingRight: MR, height: MB }}
      >
        {labels.slice(0, n).map((lbl, i) => {
          if (!xLabelIndices.has(i)) return null;
          const pct = toSvgX(i);
          const anchor =
            i === 0 ? "left" : i === n - 1 ? "right" : "center";
          return (
            <span
              key={`${lbl}-${i}`}
              className="absolute text-[9px] tabular-nums text-slate-400 whitespace-nowrap"
              style={{
                left:
                  anchor === "left"
                    ? `${pct}%`
                    : anchor === "right"
                    ? undefined
                    : `${pct}%`,
                right: anchor === "right" ? 0 : undefined,
                transform:
                  anchor === "center"
                    ? "translateX(-50%)"
                    : anchor === "left"
                    ? "none"
                    : "none",
                top: 6,
              }}
            >
              {lbl}
            </span>
          );
        })}
      </div>

      {/* ── Tooltip ───────────────────────────────────── */}
      {tooltip.visible && (
        <div
          className="pointer-events-none absolute z-20 min-w-[96px] rounded-xl border border-slate-100 bg-white/98 px-3 py-2.5 shadow-xl shadow-slate-200/60 backdrop-blur-sm"
          style={{
            top: MT + 8,
            left:
              tooltip.pct > 70
                ? `calc(${ML}px + ${tooltip.pct}% - 104px)`
                : tooltip.pct < 20
                ? ML + 4
                : `calc(${ML}px + ${tooltip.pct}% - 52px)`,
          }}
        >
          <p className="mb-1.5 text-[10px] font-semibold text-slate-400 tracking-wide uppercase">
            {labels[tooltip.index]}
          </p>
          {tooltip.data.map((s) => (
            <div key={s.label} className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full flex-shrink-0"
                style={{ background: s.color }}
              />
              <span className="text-[11px] text-slate-500">{s.label}</span>
              <span className="ml-auto pl-3 text-[11px] font-bold text-slate-900">
                {s.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
