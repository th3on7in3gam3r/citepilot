"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CitationHistoryPoint } from "@/lib/api-types";
import {
  CHART_MONTHS,
  PLATFORM_REACH,
  areaPath,
  buildCitationSeries,
  buildProjectedCitationSeries,
  chartYMax,
  pointsToPath,
  toSvgPoints,
} from "@/lib/chart-data";

const W = 720;
const H = 280;
const PAD = { top: 24, right: 16, bottom: 36, left: 48 };

function formatHistoryLabel(recordedAt: string, totalPoints: number): string {
  const parsed = new Date(recordedAt);
  if (Number.isNaN(parsed.getTime())) return "Audit";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: totalPoints <= 6 ? "numeric" : undefined,
  }).format(parsed);
}

function toHistorySeries(points: CitationHistoryPoint[]) {
  return points.map((point, index, all) => ({
    month: formatHistoryLabel(point.recordedAt, all.length || index + 1),
    value: Math.max(0, Math.min(100, Math.round(point.visibilityIndex))),
  }));
}

type CitationVolumeChartProps = {
  seed: number;
  compact?: boolean;
  citationScore?: number;
  hasRealAudit?: boolean;
  citationHistory?: CitationHistoryPoint[];
};

export function CitationVolumeChart({
  seed,
  compact = false,
  citationScore,
  hasRealAudit = false,
  citationHistory = [],
}: CitationVolumeChartProps) {
  const [level, setLevel] = useState(8);

  const { current, projected, labels, realHistoryPoints } = useMemo(() => {
    if (citationHistory.length > 0) {
      const current = toHistorySeries(citationHistory);
      return {
        current,
        projected: buildProjectedCitationSeries(current, level),
        labels: current.map((point) => point.month),
        realHistoryPoints: citationHistory.length,
      };
    }

    const series = buildCitationSeries(seed, level);
    if (citationScore === undefined) {
      return {
        ...series,
        labels: CHART_MONTHS,
        realHistoryPoints: 0,
      };
    }

    const anchor = Math.max(0, Math.min(100, Math.round(citationScore)));
    const adjusted = {
      ...series,
      current: series.current.map((point, i) =>
        i === series.current.length - 1
          ? { ...point, value: anchor }
          : {
              ...point,
              value: Math.max(
                10,
                Math.min(
                  100,
                  Math.round(anchor * (0.58 + (i / series.current.length) * 0.34)),
                ),
              ),
            },
      ),
    };
    return {
      ...adjusted,
      projected: buildProjectedCitationSeries(adjusted.current, level),
      labels: CHART_MONTHS,
      realHistoryPoints: 0,
    };
  }, [citationHistory, seed, level, citationScore]);

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
  const calloutX = lastProjected ? Math.min(lastProjected.x - 100, W - 230) : 0;
  const calloutY = lastProjected ? lastProjected.y - 46 : 0;
  const chartBadge = !hasRealAudit
    ? "Projected · run audit for live baseline"
    : realHistoryPoints >= 2
      ? `${realHistoryPoints} saved audits · real trend`
      : realHistoryPoints === 1
        ? "1 saved audit · run another for trend"
        : "Latest audit loaded · history building";

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
            Combined AI mention index across tracked prompts and platforms in the
            selected period.
          </p>
        </div>
        {!compact && (
          <div className="mt-2 rounded-full border border-accent/10 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent sm:mt-0">
            {chartBadge}
          </div>
        )}
      </div>

      <div className="mt-6 space-y-6">
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

            {labels.map((label, i) => (
              <text
                key={`${label}-${i}`}
                x={currentPts[i]?.x ?? 0}
                y={H - 10}
                textAnchor="middle"
                className="fill-muted text-[11px]"
              >
                {label}
              </text>
            ))}

            {currentPts.length > 1 && (
              <path d={areaPath(currentPts, baselineY)} fill="url(#cite-area)" />
            )}
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
              <foreignObject x={calloutX} y={calloutY} width={210} height={40}>
                <div className="rounded-lg bg-gradient-to-r from-[#7b93f0] via-[#6b8cff] to-accent px-3 py-2 text-center text-[11px] font-semibold text-white shadow-[0_12px_28px_rgba(107,140,255,0.25)]">
                  Fixing gaps lifts visibility by {liftPct}%
                </div>
              </foreignObject>
            )}

            <g transform={`translate(${PAD.left}, 12)`}>
              <line x1={0} y1={0} x2={20} y2={0} stroke="#f97316" strokeWidth={2.5} />
              <text x={28} y={4} className="fill-muted text-[11px]">
                {realHistoryPoints > 0 ? "Audit history" : "Current"}
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

        {realHistoryPoints === 1 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-xs leading-relaxed text-amber-900">
            One audit is saved so far. Run another citation audit to unlock a true
            historical trend line for this workspace.
          </div>
        )}

        {!compact && (
          <aside className="rounded-2xl border border-[#d7def8] bg-[linear-gradient(180deg,rgba(123,147,240,0.08),rgba(255,255,255,0.96))] p-4">
            <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)_180px] lg:items-start">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
                  Visibility simulator
                </p>
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  Move the slider to model how closing citation gaps can lift your
                  visibility score from the current baseline.
                </p>
                <div className="mt-4">
                  <ChartSlider level={level} onChange={setLevel} />
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                  Tracked surfaces
                </p>
                <ul className="mt-3 grid grid-cols-2 gap-2 xl:grid-cols-4">
                  {PLATFORM_REACH.map((p) => (
                    <li
                      key={p.id}
                      className="rounded-xl border border-white/80 bg-white/90 px-3 py-2 text-[11px] shadow-sm"
                    >
                      <div className="flex items-center gap-1.5">
                        <span aria-hidden>{p.flag}</span>
                        <p className="font-semibold text-ink">{p.name}</p>
                      </div>
                      <p className="mt-1 leading-relaxed text-muted">{p.audience}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="lg:flex lg:h-full lg:items-end">
                <Link
                  href="/dashboard/geo-audit"
                  className="block w-full rounded-full border border-border bg-white py-2.5 text-center text-xs font-semibold text-ink transition hover:border-accent/40 hover:bg-accent/5"
                >
                  View action plan
                </Link>
              </div>
            </div>
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
