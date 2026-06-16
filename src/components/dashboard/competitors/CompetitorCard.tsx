"use client";

import { useState } from "react";
import Link from "next/link";
import { PromptSparkline } from "@/components/dashboard/PromptSparkline";
import type {
  CompetitorCardData,
  CompetitorPromptRow,
} from "@/lib/competitors/intelligence";

function domainInitial(domain: string): string {
  const host = domain.replace(/^www\./, "").split(".")[0] ?? "?";
  return host.charAt(0).toUpperCase();
}

function faviconColor(domain: string): string {
  const colors = ["#0ea5e9", "#38bdf8", "#a78bfa", "#f472b6", "#fbbf24"];
  let h = 0;
  for (let i = 0; i < domain.length; i++) h += domain.charCodeAt(i);
  return colors[h % colors.length];
}

function gapBadgeClass(gap: CompetitorPromptRow["gap"]): string {
  switch (gap) {
    case "advantage":
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    case "tied":
      return "bg-slate-100 text-slate-700 border-slate-200";
    case "opportunity":
      return "bg-amber-50 text-amber-900 border-amber-200";
    case "gap":
      return "bg-rose-50 text-rose-800 border-rose-200";
  }
}

function formatUpdated(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

function RateBar({
  label,
  rate,
  color,
}: {
  label: string;
  rate: number;
  color: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-semibold text-ink">{label}</span>
        <span className="text-muted">{rate}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-surface">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(100, rate)}%`, background: color }}
        />
      </div>
    </div>
  );
}

export function CompetitorCard({
  data,
  expanded,
  onToggle,
  onFixGap,
}: {
  data: CompetitorCardData;
  expanded: boolean;
  onToggle: () => void;
  onFixGap: (gap: string) => void;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full flex-col gap-4 p-5 text-left transition hover:bg-surface/40 lg:flex-row lg:items-start lg:justify-between"
      >
        <div className="flex min-w-0 items-start gap-4">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
            style={{ background: faviconColor(data.domain) }}
          >
            {domainInitial(data.domain)}
          </span>
          <div className="min-w-0">
            <p className="font-display text-lg font-bold text-ink">{data.domain}</p>
            <p className="mt-1 text-xs text-muted">
              Last updated {formatUpdated(data.lastUpdated)}
            </p>
          </div>
        </div>

        <div className="grid w-full gap-4 sm:grid-cols-2 lg:max-w-md">
          <RateBar label="You" rate={data.yourCitationRate} color="#0ea5e9" />
          <RateBar label={data.domain} rate={data.theirCitationRate} color="#a78bfa" />
        </div>
      </button>

      <div className="border-t border-border px-5 py-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-600">
              Beating you on
            </p>
            {data.beatingYouOn.length === 0 ? (
              <p className="mt-2 text-sm text-muted">No prompt gaps detected.</p>
            ) : (
              <ul className="mt-2 space-y-1.5 text-sm text-ink">
                {data.beatingYouOn.map((prompt) => (
                  <li key={prompt} className="flex gap-2">
                    <span className="text-rose-500">•</span>
                    <span className="line-clamp-2">{prompt}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
              You&apos;re beating them on
            </p>
            {data.youBeatingThemOn.length === 0 ? (
              <p className="mt-2 text-sm text-muted">No advantages yet — close gaps above.</p>
            ) : (
              <ul className="mt-2 space-y-1.5 text-sm text-ink">
                {data.youBeatingThemOn.map((prompt) => (
                  <li key={prompt} className="flex gap-2">
                    <span className="text-emerald-500">•</span>
                    <span className="line-clamp-2">{prompt}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-6 rounded-xl border border-border bg-surface/40 px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="font-semibold text-ink">You</span>
            <PromptSparkline values={data.yourTrend} positive />
            <span>{data.yourTrend[data.yourTrend.length - 1]}%</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="font-semibold text-ink">{data.domain}</span>
            <PromptSparkline values={data.theirTrend} positive={false} />
            <span>{data.theirTrend[data.theirTrend.length - 1]}%</span>
          </div>
          <span className="text-[11px] text-muted">4-week citation rate trend</span>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border bg-surface/20 px-5 py-5">
          <h4 className="font-display text-sm font-bold text-ink">Prompt-by-prompt analysis</h4>
          <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-surface/60 text-xs font-semibold uppercase tracking-wide text-muted">
                  <th className="px-4 py-3">Prompt</th>
                  <th className="px-4 py-3">Your status</th>
                  <th className="px-4 py-3">Their status</th>
                  <th className="px-4 py-3">Gap</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.prompts.map((row) => (
                  <tr key={row.prompt} className="hover:bg-surface/30">
                    <td className="max-w-xs px-4 py-3 font-medium text-ink">{row.prompt}</td>
                    <td className="px-4 py-3 text-muted">{row.yourStatus}</td>
                    <td className="px-4 py-3 text-muted">{row.theirStatus}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${gapBadgeClass(row.gap)}`}
                      >
                        {row.gapLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {row.gap === "gap" || row.gap === "opportunity" ? (
                        <button
                          type="button"
                          onClick={() => onFixGap(row.actionGap)}
                          className="text-xs font-semibold text-accent hover:underline"
                        >
                          Fix gap →
                        </button>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.stealActions.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h4 className="font-display text-sm font-bold text-ink">
                  Steal their citations
                </h4>
                <Link
                  href="/dashboard/geo-audit"
                  className="text-xs font-semibold text-accent hover:underline"
                >
                  Open GEO Audit
                </Link>
              </div>
              {data.stealActions.map((action) => (
                <div
                  key={action.prompt}
                  className="rounded-xl border border-border bg-card p-4 shadow-sm"
                >
                  <p className="text-sm font-semibold text-ink">{action.prompt}</p>
                  <p className="mt-2 text-sm text-muted">
                    <span className="font-semibold text-ink">They&apos;re cited because:</span>{" "}
                    {action.citedBecause}
                  </p>
                  <p className="mt-2 text-sm text-muted">
                    <span className="font-semibold text-ink">To beat them:</span>{" "}
                    {action.beatThemAction}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <span className="rounded-full bg-mint/15 px-3 py-1 text-[11px] font-semibold text-mint">
                      Est. lift if fixed: +{action.estimatedLiftPercent}% citation rate
                    </span>
                    <button
                      type="button"
                      onClick={() => onFixGap(action.actionGap)}
                      className="rounded-full bg-gradient-to-r from-[#7b93f0] to-accent px-4 py-2 text-xs font-semibold text-white"
                    >
                      Fix gap → {action.fixTitle}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="border-t border-border px-5 py-3">
        <button
          type="button"
          onClick={onToggle}
          className="text-xs font-semibold text-accent hover:underline"
        >
          {expanded ? "Collapse details" : "Expand prompt analysis →"}
        </button>
      </div>
    </article>
  );
}
