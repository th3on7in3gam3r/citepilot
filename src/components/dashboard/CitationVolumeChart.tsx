"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CHART_MONTHS,
  PLATFORM_REACH,
  areaPath,
  buildCitationSeries,
  chartYMax,
  pointsToPath,
  toSvgPoints,
} from "@/lib/chart-data";

const W = 720;
const H = 280;
const PAD = { top: 24, right: 16, bottom: 36, left: 48 };

type CitationVolumeChartProps = {
  seed: number;
  compact?: boolean;
  citationScore?: number;
  hasRealAudit?: boolean;
};

export function CitationVolumeChart({
  seed,
  compact = false,
  citationScore,
  hasRealAudit = false,
}: CitationVolumeChartProps) {
  const [level, setLevel] = useState(8);

  const { current, projected } = useMemo(() => {
    const series = buildCitationSeries(seed, level);
    if (citationScore === undefined) return series;
    const anchor = citationScore * 12;
    const adjusted = {
      ...series,
      current: series.current.map((point, i) =>
        i === series.current.length - 1
          ? { ...point, value: anchor }
          : {
              ...point,
              value: Math.round(anchor * (0.55 + (i / series.current.length) * 0.4)),
            },
      ),
    };
    return adjusted;
  }, [seed, level, citationScore]);

  const yMax = useMemo(
    () => chartYMax([...current.map((d) => d.value), ...projected.map((d) => d.value)]),
    [current, projected],
  );

  const currentPts = toSvgPoints(current, W, H, PAD, yMax);
  const projectedPts = toSvgPoints(projected, W, H, PAD, yMax);
  const baselineY = H - PAD.bottom;

  const yTicks = useMemo(() => {
    const step = yMax / 5;
    return Array.from({ length: 6 }, (_, i) => Math.round(step * i));
  }, [yMax]);

  const liftPct = useMemo(() => {
    const lastCurrent = current[current.length - 1]?.value ?? 1;
    const lastProjected = projected[projected.length - 1]?.value ?? 1;
    return Math.round(((lastProjected - lastCurrent) / lastCurrent) * 100);
  }, [current, projected]);

  const lastProjected = projectedPts[projectedPts.length - 1];
  const calloutX = lastProjected ? Math.min(lastProjected.x - 120, W - 260) : 0;
  const calloutY = lastProjected ? lastProjected.y - 52 : 0;

  return (
    <div
      className={`rounded-2xl border border-border bg-white ${
        compact ? "p-4" : "p-6 md:p-8"
      }`}
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-ink md:text-xl">
            Citation visibility
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Combined AI mention index across tracked prompts and platforms in the
            selected period.
          </p>
        </div>
        {!compact && (
          <div className="mt-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent sm:mt-0">
            {hasRealAudit ? "From your latest audit" : "Projected · run audit for live baseline"}
          </div>
        )}
      </div>

      <div className={`mt-6 grid gap-6 ${compact ? "" : "lg:grid-cols-[1fr_220px]"}`}>
        <div className="relative">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="h-auto w-full"
            role="img"
            aria-label="Citation visibility trend chart"
          >
            <defs>
              <linearGradient id="cite-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#f97316" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {yTicks.map((tick) => {
              const y =
                PAD.top +
                (H - PAD.top - PAD.bottom) -
                (tick / yMax) * (H - PAD.top - PAD.bottom);
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
                    x={PAD.left - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-muted text-[11px]"
                  >
                    {tick}
                  </text>
                </g>
              );
            })}

            {CHART_MONTHS.map((month, i) => (
              <text
                key={month}
                x={currentPts[i]?.x ?? 0}
                y={H - 10}
                textAnchor="middle"
                className="fill-muted text-[11px]"
              >
                {month}
              </text>
            ))}

            <path d={areaPath(currentPts, baselineY)} fill="url(#cite-area)" />
            <path
              d={pointsToPath(currentPts)}
              fill="none"
              stroke="#f97316"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={pointsToPath(projectedPts)}
              fill="none"
              stroke="#14b8a6"
              strokeWidth={2.5}
              strokeDasharray="8 6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {currentPts.map((p, i) => (
              <circle
                key={`c-${i}`}
                cx={p.x}
                cy={p.y}
                r={3}
                fill="#fff"
                stroke="#f97316"
                strokeWidth={2}
              />
            ))}

            {lastProjected && (
              <circle
                cx={lastProjected.x}
                cy={lastProjected.y}
                r={4}
                fill="#14b8a6"
              />
            )}

            {!compact && lastProjected && (
              <foreignObject x={calloutX} y={calloutY} width={240} height={44}>
                <div className="rounded-lg bg-accent px-3 py-2 text-center text-xs font-semibold text-white shadow-md">
                  Fixing gaps lifts visibility by {liftPct}%
                </div>
              </foreignObject>
            )}

            <g transform={`translate(${PAD.left}, 12)`}>
              <line x1={0} y1={0} x2={20} y2={0} stroke="#f97316" strokeWidth={2.5} />
              <text x={28} y={4} className="fill-muted text-[11px]">
                Current
              </text>
              <line
                x1={90}
                y1={0}
                x2={110}
                y2={0}
                stroke="#14b8a6"
                strokeWidth={2.5}
                strokeDasharray="6 4"
              />
              <text x={118} y={4} className="fill-muted text-[11px]">
                Projected
              </text>
            </g>
          </svg>
        </div>

        {!compact && (
          <aside className="flex flex-col rounded-xl border border-border bg-surface/60 p-4">
            <p className="text-xs leading-relaxed text-muted">
              Move the slider to see how closing citation gaps boosts AI visibility.
            </p>
            <div className="mt-4">
              <ChartSlider level={level} onChange={setLevel} />
            </div>
            <ul className="mt-5 flex-1 space-y-3">
              {PLATFORM_REACH.map((p) => (
                <li key={p.id} className="flex items-start gap-2 text-xs">
                  <span aria-hidden>{p.flag}</span>
                  <div>
                    <p className="font-semibold text-ink">{p.name}</p>
                    <p className="text-muted">{p.audience}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Link
              href="/dashboard/geo-audit"
              className="mt-4 block w-full rounded-full border border-border bg-white py-2.5 text-center text-xs font-semibold text-ink transition hover:border-accent/40 hover:bg-accent/5"
            >
              View action plan
            </Link>
          </aside>
        )}
      </div>
    </div>
  );
}

function ChartSlider({
  level,
  onChange,
}: {
  level: number;
  onChange: (v: number) => void;
}) {
  return (
    <>
      <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted">
        <span>Actions taken</span>
        <span className="rounded-full bg-white px-2 py-0.5 font-bold text-ink shadow-sm">
          {level}
        </span>
      </div>
      <input
        type="range"
        min={1}
        max={20}
        value={level}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-border accent-accent"
      />
      <div className="mt-1 flex justify-between text-[10px] text-muted">
        <span>1</span>
        <span>20+</span>
      </div>
    </>
  );
}
