"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CitationHistoryPoint } from "@/lib/api-types";
import { DashboardLineChart } from "@/components/charts/DashboardCharts";
import { CHART_SERIES } from "@/lib/charts/theme";
import {
  CHART_MONTHS,
  PLATFORM_REACH,
  buildCitationSeries,
  buildProjectedCitationSeries,
  chartYMax,
} from "@/lib/chart-data";

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

  const singlePointFromScore =
    hasRealAudit &&
    citationHistory.length === 0 &&
    citationScore !== undefined;

  const insufficientHistory =
    hasRealAudit &&
    citationHistory.length === 0 &&
    citationScore === undefined;

  const { current, projected, labels, realHistoryPoints } = useMemo(() => {
    if (singlePointFromScore) {
      const anchor = Math.max(0, Math.min(100, Math.round(citationScore!)));
      const current = [{ month: "Latest audit", value: anchor }];
      return {
        current,
        projected: buildProjectedCitationSeries(current, level),
        labels: current.map((point) => point.month),
        realHistoryPoints: 1,
      };
    }

    if (insufficientHistory) {
      return {
        current: [],
        projected: [],
        labels: [] as string[],
        realHistoryPoints: 0,
      };
    }

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
    if (citationScore === undefined || hasRealAudit) {
      return {
        current: [],
        projected: [],
        labels: [] as string[],
        realHistoryPoints: 0,
      };
    }

    return {
      ...series,
      labels: CHART_MONTHS,
      realHistoryPoints: 0,
    };
  }, [
    citationHistory,
    seed,
    level,
    citationScore,
    hasRealAudit,
    insufficientHistory,
    singlePointFromScore,
  ]);

  const yMax = useMemo(
    () => chartYMax([...current.map((d) => d.value), ...projected.map((d) => d.value)]),
    [current, projected],
  );

  const liftPct = useMemo(() => {
    const lastCurrent = current[current.length - 1]?.value ?? 1;
    const lastProjected = projected[projected.length - 1]?.value ?? 1;
    return Math.round(((lastProjected - lastCurrent) / lastCurrent) * 100);
  }, [current, projected]);

  const chartBadge = insufficientHistory
    ? "Insufficient history"
    : !hasRealAudit
      ? "Run audit for live data"
      : realHistoryPoints >= 2
        ? `${realHistoryPoints} saved audits · real trend`
        : realHistoryPoints === 1
          ? "1 audit saved · run another for a trend line"
          : "Latest audit loaded · history building";

  if (insufficientHistory || (!hasRealAudit && current.length === 0)) {
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
          {insufficientHistory
            ? "Your latest audit is saved, but there is not enough history yet to chart a trend. Run another citation audit to unlock a real visibility line."
            : "Run a citation audit to replace placeholder charts with measured visibility from your workspace."}
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
        <div className="relative" role="img" aria-label="Citation visibility trend chart">
          <DashboardLineChart
            labels={labels}
            height={280}
            yMax={yMax}
            showLegend
            series={[
              {
                label: realHistoryPoints > 0 ? "Audit history" : "Current",
                values: current.map((d) => d.value),
                color: CHART_SERIES.current,
                fill: current.length > 1,
              },
              {
                label: "Projected",
                values: projected.map((d) => d.value),
                color: CHART_SERIES.projected,
                dashed: true,
              },
            ]}
          />
          {!compact && projected.length > 0 && (
            <div className="pointer-events-none absolute right-4 top-2 max-w-[210px] rounded-lg bg-gradient-to-r from-[#7b93f0] via-[#6b8cff] to-accent px-3 py-2 text-center text-[11px] font-semibold text-white shadow-[0_12px_28px_rgba(107,140,255,0.25)]">
              Fixing gaps lifts visibility by {liftPct}%
            </div>
          )}
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
                      className="rounded-xl border border-border bg-card px-3 py-2 text-[11px] shadow-sm dark:border-[#333]"
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
