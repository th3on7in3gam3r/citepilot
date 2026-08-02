"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { KeywordOverlapSegment } from "@/lib/dashboard/overview-filters";

export function CompetitorOverlapChart({
  segments,
  title = "Keyword overlap",
  description = "How your tracked prompts split between leads, contested citations, and open gaps.",
}: {
  segments: KeywordOverlapSegment[];
  title?: string;
  description?: string;
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  if (total === 0) {
    return (
      <div className="dash-content-card flex min-h-[280px] flex-col justify-center p-6">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="mt-2 text-sm text-muted">
          Run a citation audit to map prompt overlap against competitors.
        </p>
      </div>
    );
  }

  return (
    <div className="dash-content-card p-6">
      <div className="mb-4">
        <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div className="relative mx-auto h-[220px] w-full max-w-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={segments}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={96}
                paddingAngle={2}
                strokeWidth={0}
              >
                {segments.map((segment) => (
                  <Cell key={segment.label} fill={segment.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0]?.payload as KeywordOverlapSegment;
                  const pct = Math.round((item.value / total) * 100);
                  return (
                    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg">
                      <p className="font-semibold text-ink">{item.label}</p>
                      <p className="text-muted">
                        {item.value} prompts · {pct}%
                      </p>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="font-display text-3xl font-bold text-ink">{total}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              Prompts
            </p>
          </div>
        </div>

        <ul className="space-y-3">
          {segments.map((segment) => {
            const pct = Math.round((segment.value / total) * 100);
            return (
              <li
                key={segment.label}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface/50 px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ background: segment.color }}
                    aria-hidden
                  />
                  <span className="truncate text-sm font-medium text-ink">{segment.label}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-ink">{segment.value}</p>
                  <p className="text-xs text-muted">{pct}%</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
