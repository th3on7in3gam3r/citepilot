"use client";

import type { ScanDeltaDetail, ScanDeltaSummary } from "@/lib/audit/scan-delta";
import { formatScoreDelta } from "@/lib/audit/score-breakdown";

function DeltaBadge({
  value,
  suffix = "",
}: {
  value: number;
  suffix?: string;
}) {
  if (value === 0) {
    return (
      <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-semibold text-muted">
        No change{suffix}
      </span>
    );
  }
  const positive = value > 0;
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
        positive ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
      }`}
    >
      {formatScoreDelta(value)}
      {suffix}
    </span>
  );
}

function GapList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "resolved" | "new" | "unchanged";
}) {
  if (items.length === 0) return null;

  const styles =
    tone === "resolved"
      ? "border-emerald-200 bg-emerald-50/50 text-emerald-900"
      : tone === "new"
        ? "border-amber-200 bg-amber-50/50 text-amber-950"
        : "border-border bg-surface/80 text-muted";

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</p>
      <ul className={`mt-2 space-y-2 rounded-xl border p-3 ${styles}`}>
        {items.map((gap) => (
          <li key={gap} className="text-sm leading-relaxed">
            {tone === "resolved" && <span className="mr-1.5 font-bold">✓</span>}
            {tone === "new" && <span className="mr-1.5 font-bold">+</span>}
            {gap}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PromptList({
  title,
  prompts,
  tone,
}: {
  title: string;
  prompts: string[];
  tone: "gained" | "lost";
}) {
  if (prompts.length === 0) return null;

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</p>
      <ul
        className={`mt-2 space-y-1.5 rounded-xl border p-3 text-sm ${
          tone === "gained"
            ? "border-emerald-200 bg-emerald-50/40 text-emerald-900"
            : "border-red-200 bg-red-50/40 text-red-900"
        }`}
      >
        {prompts.map((p) => (
          <li key={p} className="leading-snug">
            {tone === "gained" ? "▲ " : "▼ "}
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ScanDeltaDetailView({
  scanDelta,
  domain,
  compact = false,
}: {
  scanDelta: ScanDeltaSummary;
  domain: string;
  compact?: boolean;
}) {
  const detail = scanDelta.detail;

  if (!scanDelta.available || !detail) {
    return (
      <p className="text-sm text-muted">
        Run another audit on <strong className="text-ink">{domain}</strong> to compare
        scores, gaps, and prompt citations against this scan.
      </p>
    );
  }

  if (detail.fullyUnchanged) {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-border bg-surface/60 px-4 py-3">
          <p className="text-sm font-semibold text-ink">Nothing changed vs your last scan</p>
          <p className="mt-1 text-sm text-muted">
            Same citation score ({detail.currentScore}/100), technical score (
            {detail.currentGeoScore}/100), {detail.currentCited}/{detail.promptTotal} prompts
            cited, and the same gap list. Fixes only count after they are live on{" "}
            <strong className="text-ink">{domain}</strong> — toggling Quick Fix in CitePilot
            alone does not update the crawl.
          </p>
        </div>
        {detail.unchangedGapLabels.length > 0 && (
          <GapList title="Gaps still open" items={detail.unchangedGapLabels} tone="unchanged" />
        )}
      </div>
    );
  }

  return (
    <div className={compact ? "space-y-4" : "space-y-5"}>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Citation score
          </p>
          <p className="mt-1 font-display text-2xl font-bold text-ink">
            {detail.currentScore}
            <span className="text-sm font-normal text-muted">/100</span>
          </p>
          <p className="mt-1 text-xs text-muted">
            was {detail.previousScore} · <DeltaBadge value={scanDelta.scoreDelta ?? 0} />
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Technical (live site)
          </p>
          <p className="mt-1 font-display text-2xl font-bold text-ink">
            {detail.currentGeoScore}
            <span className="text-sm font-normal text-muted">/100</span>
          </p>
          <p className="mt-1 text-xs text-muted">
            was {detail.previousGeoScore} · <DeltaBadge value={detail.geoScoreDelta} />
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Prompts cited
          </p>
          <p className="mt-1 font-display text-2xl font-bold text-ink">
            {detail.currentCited}
            <span className="text-sm font-normal text-muted">/{detail.promptTotal}</span>
          </p>
          <p className="mt-1 text-xs text-muted">
            was {detail.previousCited} · <DeltaBadge value={detail.citedDelta} />
          </p>
        </div>
      </div>

      {scanDelta.chips.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {scanDelta.chips.map((chip) => {
            const negative =
              chip.startsWith("−") || (chip.startsWith("-") && !chip.startsWith("+"));
            const positive = chip.startsWith("+");
            return (
              <li
                key={chip}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  negative
                    ? "bg-red-50 text-red-800"
                    : positive
                      ? "bg-emerald-50 text-emerald-800"
                      : "bg-surface text-ink"
                }`}
              >
                {chip}
              </li>
            );
          })}
        </ul>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <GapList title="Gaps cleared" items={detail.resolvedGapLabels} tone="resolved" />
        <GapList title="New gaps" items={detail.newGapLabels} tone="new" />
        <PromptList title="Prompts newly cited" prompts={detail.promptsGained} tone="gained" />
        <PromptList title="Prompts no longer cited" prompts={detail.promptsLostLabels} tone="lost" />
      </div>

      {detail.unchangedGapLabels.length > 0 && (
        <GapList title="Still open from last scan" items={detail.unchangedGapLabels} tone="unchanged" />
      )}
    </div>
  );
}
