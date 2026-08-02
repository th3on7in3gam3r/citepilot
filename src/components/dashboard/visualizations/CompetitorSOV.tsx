"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CompetitorSovData } from "@/lib/citations/viz-data";

function truncatePrompt(text: string, max = 28): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 100;
      const y = 100 - (value / max) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 100" className="h-8 w-full" preserveAspectRatio="none" aria-hidden>
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        className="text-accent"
        points={points}
      />
    </svg>
  );
}

export function CompetitorSOV({ data }: { data: CompetitorSovData }) {
  const domainKeys = Array.from(
    new Set(data.bars.flatMap((bar) => bar.segments.map((s) => s.domain))),
  );

  const chartRows = data.bars.map((bar) => {
    const row: Record<string, string | number> = {
      prompt: truncatePrompt(bar.prompt),
      fullPrompt: bar.prompt,
      platformsCited: bar.platformsCited.join(", "),
    };
    for (const key of domainKeys) {
      row[key] = bar.segments.find((s) => s.domain === key)?.value ?? 0;
    }
    return row;
  });

  const colors = Object.fromEntries(
    data.bars
      .flatMap((bar) => bar.segments)
      .map((segment) => [segment.domain, segment.color]),
  );

  if (!data.available || data.bars.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border px-5 py-8 text-sm text-muted">
        {data.benchmark.unavailableReason ??
          "Add competitors and run an audit to unlock share-of-voice analysis."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {data.cards.map((card) => (
          <article
            key={card.domain}
            className={`rounded-2xl border px-4 py-4 ${
              card.isYou
                ? "border-accent/30 bg-accent/[0.06]"
                : "border-border bg-white dark:border-[#333] dark:bg-[#111]"
            }`}
          >
            <p className="truncate text-sm font-semibold text-ink dark:text-white">
              {card.domain}
              {card.isYou ? (
                <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-accent">
                  You
                </span>
              ) : null}
            </p>
            <p className="mt-2 font-display text-3xl font-bold text-ink dark:text-white">
              {card.sovPercent}%
            </p>
            <p className="mt-1 text-xs text-muted">
              Share of voice
              {card.deltaPercent != null && (
                <span
                  className={`ml-2 font-semibold ${
                    card.deltaPercent >= 0 ? "text-mint" : "text-red-500"
                  }`}
                >
                  {card.deltaPercent >= 0 ? "↑" : "↓"} {Math.abs(card.deltaPercent)}%
                </span>
              )}
            </p>
            <div className="mt-3 text-accent">
              <Sparkline values={card.history} />
            </div>
          </article>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-white p-4 dark:border-[#333] dark:bg-[#111]">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted">
          Share of voice by money prompt
        </p>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartRows} margin={{ top: 8, right: 8, left: 0, bottom: 48 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="prompt"
                tick={{ fontSize: 11 }}
                interval={0}
                angle={-24}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const row = payload[0]?.payload as {
                    fullPrompt?: string;
                    platformsCited?: string;
                  };
                  return (
                    <div className="max-w-xs rounded-xl border border-border bg-white p-3 text-xs shadow-lg dark:border-[#333] dark:bg-[#111]">
                      <p className="font-semibold text-ink dark:text-white">
                        {row.fullPrompt ?? label}
                      </p>
                      <ul className="mt-2 space-y-1">
                        {payload.map((entry) => (
                          <li key={String(entry.name)} className="flex justify-between gap-4">
                            <span style={{ color: entry.color }}>{entry.name}</span>
                            <span className="font-semibold">{entry.value}%</span>
                          </li>
                        ))}
                      </ul>
                      {row.platformsCited ? (
                        <p className="mt-2 text-muted">Platforms cited: {row.platformsCited}</p>
                      ) : null}
                    </div>
                  );
                }}
              />
              {domainKeys.map((key) => (
                <Bar
                  key={key}
                  dataKey={key}
                  stackId="sov"
                  fill={colors[key] ?? "#94a3b8"}
                  radius={key === domainKeys[domainKeys.length - 1] ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
