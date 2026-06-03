"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { effectInit } from "@/lib/react/effect-init";
import { CitationVolumeChart } from "@/components/dashboard/CitationVolumeChart";
import { GoogleAnalyticsPanel } from "@/components/dashboard/GoogleAnalyticsPanel";
import { Panel } from "@/components/dashboard/DashboardUI";
import { GooeyFilter, LiquidToggle } from "@/components/ui/liquid-toggle";
import type { WorkspaceSnapshot } from "@/lib/dashboard";
import type { PromptRow } from "@/lib/features";
import {
  buildCompetitorBenchmark,
  buildCorrelationInsights,
  promptRowsForWorkspace,
  type BenchmarkPromptRow,
  type CompetitorBenchmarkResult,
  type CorrelationInsight,
} from "@/lib/dashboard-data";

type Tab = "google" | "llms";

const sentimentStyle = {
  Positive: "bg-emerald-50 text-emerald-700",
  Neutral: "bg-amber-50 text-amber-700",
  Negative: "bg-orange-50 text-orange-700",
};

const confidenceStyle: Record<CorrelationInsight["confidence"], string> = {
  High: "bg-emerald-50 text-emerald-700",
  Medium: "bg-amber-50 text-amber-800",
  Directional: "bg-sky-50 text-sky-800",
};

function benchmarkBarWidth(value: number | null) {
  if (value === null) return "0%";
  return `${Math.max(8, Math.min(100, value))}%`;
}

function formatScore(value: number | null) {
  return value === null ? "—" : String(value);
}

function benchmarkRankLabel(rank: number) {
  if (rank === 1) return "Leader";
  if (rank === 2) return "Challenger";
  return `Rank #${rank}`;
}

function benchmarkDeltaTone(delta: number | null) {
  if (delta === null) return "bg-surface text-muted";
  if (delta > 0) return "bg-red-50 text-red-700";
  if (delta < 0) return "bg-emerald-50 text-emerald-700";
  return "bg-surface text-muted";
}

function benchmarkPromptState(prompt: BenchmarkPromptRow, yourBrand: string) {
  if (prompt.youCited || prompt.leader === yourBrand) {
    return {
      label: "Defend lead",
      tone: "bg-emerald-50 text-emerald-700",
      rail: "from-emerald-400 via-mint to-glow",
      summary: "You already lead here. Protect it with freshness and stronger proof assets.",
    };
  }

  if (prompt.gapToLeader !== null && prompt.gapToLeader <= 6) {
    return {
      label: "Quick flip",
      tone: "bg-sky-50 text-sky-800",
      rail: "from-[#7b93f0] via-accent to-glow",
      summary: "This is close enough to flip with sharper comparisons and answer formatting.",
    };
  }

  return {
    label: "Attack prompt",
    tone: "bg-amber-50 text-amber-800",
    rail: "from-amber-300 via-orange-300 to-amber-500",
    summary: "Treat this as a larger competitive gap that needs dedicated comparison content.",
  };
}

export function AnalyticsDashboard({ workspace }: { workspace: WorkspaceSnapshot }) {
  const workspaceId = workspace.workspaceId ?? workspace.id;
  const [tab, setTab] = useState<Tab>("llms");
  const [gscConnected, setGscConnected] = useState(false);

  const loadGscStatus = useCallback(async () => {
    if (!workspaceId) return;
    const res = await fetch(
      `/api/gsc/metrics?workspaceId=${encodeURIComponent(workspaceId)}`,
      { credentials: "include" },
    );
    if (!res.ok) return;
    const data = (await res.json()) as {
      metrics: { connected: boolean };
    };
    const connected = data.metrics.connected;
    setGscConnected(connected);
    if (connected) setTab("google");
  }, [workspaceId]);

  useEffect(() => {
    effectInit(() => {
      void loadGscStatus();
    });
  }, [loadGscStatus]);

  const rows = useMemo(
    () => promptRowsForWorkspace(workspace),
    [workspace],
  );
  const benchmark = useMemo(
    () => buildCompetitorBenchmark(workspace, rows),
    [workspace, rows],
  );
  const correlations = useMemo(
    () => buildCorrelationInsights(workspace, rows),
    [workspace, rows],
  );

  return (
    <>
      <GooeyFilter />
      <div className="overflow-hidden rounded-2xl border border-border bg-[linear-gradient(135deg,rgba(123,147,240,0.08),rgba(255,255,255,0.98),rgba(34,211,238,0.06))] p-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
              Analytics workspace
            </p>
            <p className="mt-1 text-sm text-muted">
              {gscConnected
                ? "Search Console is connected — organic clicks lead this view. Switch to LLMs for citation audits and prompt coverage."
                : "Switch between live organic performance (after GSC connect) and LLM citation intelligence for"}{" "}
              <span className="font-semibold text-ink">{workspace.domain}</span>.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <AnalyticsSourceToggle
              value={tab}
              onChange={setTab}
              gscConnected={gscConnected}
            />
            <select className="rounded-full border border-border bg-white px-4 py-2 text-sm text-muted shadow-sm">
              <option>Last 30 days</option>
              <option>Last 90 days</option>
            </select>
          </div>
        </div>
      </div>

      {tab === "llms" ? (
        <LLMPanel
          workspace={workspace}
          rows={rows}
          benchmark={benchmark}
          correlations={correlations}
        />
      ) : (
        <GoogleAnalyticsPanel
          workspace={workspace}
          preferOrganicLead={gscConnected}
        />
      )}
      {!workspace.hasRealAudit && (
        <p className="mt-4 text-center text-xs text-muted">
          Run a citation audit from Settings or Overview to replace estimates with
          live prompt results.
        </p>
      )}
    </>
  );
}

function AnalyticsSourceToggle({
  value,
  onChange,
  gscConnected,
}: {
  value: Tab;
  onChange: (tab: Tab) => void;
  gscConnected: boolean;
}) {
  const googleLabel = gscConnected ? "Google · Live" : "Google";
  const isLlms = value === "llms";

  return (
    <div
      className="flex items-center gap-3 rounded-full border border-border/90 bg-white/80 px-3 py-2 shadow-sm backdrop-blur-sm"
      role="group"
      aria-label="Analytics data source"
    >
      <button
        type="button"
        onClick={() => onChange("google")}
        className={`text-xs font-semibold transition sm:text-sm ${
          !isLlms ? "text-ink" : "text-muted hover:text-ink"
        }`}
      >
        {googleLabel}
      </button>
      <LiquidToggle
        id="analytics-source-toggle"
        checked={isLlms}
        onCheckedChange={(checked) => onChange(checked ? "llms" : "google")}
        aria-label={`Switch to ${isLlms ? "Google Search Console" : "LLM citation analytics"}`}
        className="[--c-active:#6b8cff] shrink-0"
      />
      <button
        type="button"
        onClick={() => onChange("llms")}
        className={`text-xs font-semibold transition sm:text-sm ${
          isLlms ? "text-ink" : "text-muted hover:text-ink"
        }`}
      >
        LLMs
      </button>
    </div>
  );
}

function LLMPanel({
  workspace,
  rows,
  benchmark,
  correlations,
}: {
  workspace: WorkspaceSnapshot;
  rows: PromptRow[];
  benchmark: CompetitorBenchmarkResult;
  correlations: CorrelationInsight[];
}) {
  return (
    <>
      <Panel title="Brand presence" className="mt-6">
        <div className="overflow-hidden rounded-2xl border border-[#d7def8] bg-[linear-gradient(135deg,rgba(123,147,240,0.1),rgba(255,255,255,0.98),rgba(34,211,238,0.08))] p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
                Presence overview
              </p>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
                Prompt-level visibility for your tracked AI surfaces. Use this section to
                see where your brand is already present, how those prompts feel, and
                which buyer questions still need a stronger answer footprint.
              </p>
            </div>
            <div className="rounded-full border border-white/80 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink shadow-sm">
              Buyer question: {workspace.buyerQuestion}
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/80 bg-white/90 px-5 py-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                Visibility score
              </p>
              <div className="mt-2 flex items-end justify-between gap-4">
                <p className="font-display text-4xl font-bold text-ink">
                  {workspace.visibilityScore}%
                </p>
                <span className="rounded-full bg-ink px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                  {workspace.hasRealAudit ? "Live signal" : "Projected"}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted">
                Combined view across prompt coverage, citation evidence, and current AI
                visibility strength.
              </p>
            </div>
            <PromptsCard workspace={workspace} />
          </div>
        </div>
        <PromptTable rows={rows} hasRealAudit={workspace.hasRealAudit} />
      </Panel>
      <CompetitorBenchmarkPanel workspace={workspace} benchmark={benchmark} />
      <div className="mt-6">
        <CitationVolumeChart
          seed={0}
          citationScore={workspace.citationScore}
          hasRealAudit={workspace.hasRealAudit}
          citationHistory={workspace.citationHistory}
        />
      </div>
      <CorrelationInsightsPanel insights={correlations} />
    </>
  );
}

function CorrelationInsightsPanel({
  insights,
}: {
  insights: CorrelationInsight[];
}) {
  return (
    <Panel title="Correlation insights" className="mt-6">
      <div className="overflow-hidden rounded-2xl border border-[#d7def8] bg-[linear-gradient(135deg,rgba(123,147,240,0.08),rgba(255,255,255,0.98),rgba(34,211,238,0.08))] p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
          Directional analysis
        </p>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
          Directional insights inferred from your latest prompt leadership, AI
          platform coverage, and technical audit signals. These are not strict
          causal claims, but they do highlight which fixes most likely explain or
          unlock visibility changes.
        </p>
      </div>

      {insights.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-[linear-gradient(135deg,rgba(123,147,240,0.06),rgba(255,255,255,0.98))] px-5 py-5">
          <p className="text-sm font-semibold text-ink">
            Run a fresh audit to unlock directional correlation insights.
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Correlation insights get more useful once CitePilot has live technical and
            prompt data to compare against platform coverage and benchmark gaps.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className="relative overflow-hidden rounded-2xl border border-border bg-[linear-gradient(180deg,rgba(248,250,252,0.96),rgba(244,247,251,0.9))] px-5 py-4"
            >
              <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#7b93f0] via-accent to-glow" />
              <div className="flex flex-wrap items-start justify-between gap-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${confidenceStyle[insight.confidence]}`}
                >
                  {insight.confidence} confidence
                </span>
                {insight.estimatedLift && (
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink">
                    Est. lift {insight.estimatedLift}
                  </span>
                )}
              </div>

              <p className="mt-3 font-medium text-ink">{insight.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{insight.summary}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {insight.platforms.map((platform) => (
                  <span
                    key={platform}
                    className="rounded-full border border-border bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted"
                  >
                    {platform}
                  </span>
                ))}
              </div>

              <ul className="mt-4 space-y-2 text-sm text-muted">
                {insight.evidence.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-accent">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function CompetitorBenchmarkPanel({
  workspace,
  benchmark,
}: {
  workspace: WorkspaceSnapshot;
  benchmark: CompetitorBenchmarkResult;
}) {
  const { brands, prompts } = benchmark;
  if (!benchmark.available) {
    return (
      <Panel title="Competitor benchmark" className="mt-6">
        <div className="rounded-2xl border border-dashed border-border bg-surface/40 px-5 py-5">
          <p className="text-sm font-semibold text-ink">Insufficient benchmark data</p>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            {benchmark.unavailableReason ??
              "Add competitors and run a citation audit to unlock side-by-side prompt benchmarking."}
          </p>
          {!workspace.hasRealAudit && (
            <Link
              href="/audit"
              className="mt-4 inline-flex rounded-full border border-border bg-white px-4 py-2 text-xs font-semibold text-ink"
            >
              Run citation audit
            </Link>
          )}
        </div>
      </Panel>
    );
  }

  if (workspace.competitors.length === 0) {
    return (
      <Panel title="Competitor benchmark" className="mt-6">
        <div className="overflow-hidden rounded-2xl border border-dashed border-border bg-[linear-gradient(135deg,rgba(123,147,240,0.08),rgba(255,255,255,0.96),rgba(34,211,238,0.08))] px-5 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
                Comparative Intelligence
              </p>
              <p className="mt-2 text-sm font-semibold text-ink">
                Add competitors to unlock side-by-side benchmarking.
              </p>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                CitePilot compares your tracked prompts against up to three competitors
                so you can see who leads, where the biggest visibility gaps sit, and
                which comparison prompts deserve the next push.
              </p>
            </div>
            <div className="grid gap-2 text-xs text-muted sm:grid-cols-3">
              <div className="rounded-xl border border-white/80 bg-white/80 px-4 py-3">
                <p className="font-semibold text-ink">Prompt leaders</p>
                <p className="mt-1">See who wins each tracked buyer question.</p>
              </div>
              <div className="rounded-xl border border-white/80 bg-white/80 px-4 py-3">
                <p className="font-semibold text-ink">Gap sizing</p>
                <p className="mt-1">Spot where a few points could flip the outcome.</p>
              </div>
              <div className="rounded-xl border border-white/80 bg-white/80 px-4 py-3">
                <p className="font-semibold text-ink">Executive-ready</p>
                <p className="mt-1">A cleaner competitive view for clients and teams.</p>
              </div>
            </div>
          </div>
          <Link
            href="/dashboard/settings"
            className="mt-5 inline-flex rounded-full border border-border bg-white px-4 py-2 text-xs font-semibold text-ink transition hover:bg-surface"
          >
            Add competitors in Settings
          </Link>
        </div>
      </Panel>
    );
  }

  const topGap = prompts
    .filter((prompt) => !prompt.youCited)
    .sort((a, b) => (a.yourScore ?? 0) - (b.yourScore ?? 0))[0];
  const yourBrand = brands.find((b) => b.measured)?.brand ?? workspace.domain;
  const rankedBrands = [...brands].sort((a, b) => {
    const aScore = a.avgVisibility ?? -1;
    const bScore = b.avgVisibility ?? -1;
    if (bScore !== aScore) return bScore - aScore;
    return b.promptsLed - a.promptsLed;
  });
  const rankMap = new Map(rankedBrands.map((brand, index) => [brand.brand, index + 1]));
  const yourRank = rankMap.get(yourBrand) ?? 1;
  const leaderBrand = rankedBrands[0] ?? brands[0];
  const yourAverage =
    brands.find((brand) => brand.brand === yourBrand)?.avgVisibility ?? null;
  const leaderGap =
    leaderBrand?.avgVisibility !== null &&
    leaderBrand?.avgVisibility !== undefined &&
    yourAverage !== null
      ? Math.max(0, (leaderBrand.avgVisibility ?? 0) - yourAverage)
      : null;
  const promptsWon = prompts.filter((prompt) => prompt.leader === yourBrand).length;
  const promptsBehind = prompts.filter((prompt) => prompt.leader !== yourBrand).length;
  const uncitedBehind = prompts.filter((prompt) => !prompt.youCited).length;
  const strongestPrompt = prompts
    .filter((prompt) => prompt.youCited)
    .sort((a, b) => (b.yourScore ?? 0) - (a.yourScore ?? 0))[0];
  const summaryHeadline =
    promptsWon === prompts.length
      ? "You are cited on every audited prompt in this benchmark."
      : `${promptsBehind} prompt${promptsBehind === 1 ? "" : "s"} still need citation coverage.`;

  return (
    <Panel title="Competitor benchmark" className="mt-6">
      <div className="relative overflow-hidden rounded-2xl border border-[#d7def8] bg-[linear-gradient(135deg,rgba(123,147,240,0.12),rgba(255,255,255,0.98),rgba(34,211,238,0.1))] p-5">
        <div className="pointer-events-none absolute top-0 right-0 h-40 w-40 translate-x-10 -translate-y-10 rounded-full bg-accent/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-12 h-28 w-28 translate-y-8 rounded-full bg-glow/15 blur-3xl" />
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
              Competitive Snapshot
            </p>
            <p className="mt-2 max-w-3xl text-base font-semibold text-ink">
              {summaryHeadline}
            </p>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
              {benchmark.unavailableReason ??
                "Your cite status per audited prompt is shown below. Competitor visibility scores require dedicated competitor scans."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-white/80 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink shadow-sm">
              {prompts.length} tracked prompt{prompts.length === 1 ? "" : "s"}
            </span>
            <span className="rounded-full border border-white/80 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink shadow-sm">
              {brands.length} brands compared
            </span>
            {uncitedBehind > 0 && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-800 shadow-sm">
                {uncitedBehind} prompt{uncitedBehind === 1 ? "" : "s"} not citing you
              </span>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/80 bg-white/90 px-5 py-4 shadow-sm backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              Your standing
            </p>
            <div className="mt-2 flex items-end justify-between gap-4">
              <p className="font-display text-4xl font-bold text-ink">#{yourRank}</p>
              <span className="rounded-full bg-ink px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                {benchmarkRankLabel(yourRank)}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted">
              {leaderGap !== null && leaderGap > 0
                ? `${leaderGap} visibility points behind ${leaderBrand?.brand}.`
                : promptsWon === prompts.length
                  ? "You are cited on every audited prompt in this workspace."
                  : "Competitor visibility scores are not measured yet — your audit cite status is shown per prompt."}
            </p>
          </div>

          <div className="rounded-2xl border border-white/80 bg-white/90 px-5 py-4 shadow-sm backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              Prompt split
            </p>
            <div className="mt-2 flex items-end justify-between gap-4">
              <p className="font-display text-4xl font-bold text-ink">{promptsWon}</p>
              <span className="text-sm font-semibold text-muted">
                / {prompts.length} won
              </span>
            </div>
            <p className="mt-2 text-sm text-muted">
              {promptsBehind > 0
                ? `${promptsBehind} prompt${promptsBehind === 1 ? "" : "s"} still led by competitors.`
                : "You lead every tracked benchmark prompt right now."}
            </p>
          </div>

          <div className="rounded-2xl border border-white/80 bg-white/90 px-5 py-4 shadow-sm backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              Priority opportunity
            </p>
            <p className="mt-2 font-semibold text-ink">
              {topGap?.prompt ?? strongestPrompt?.prompt ?? workspace.buyerQuestion}
            </p>
            <p className="mt-2 text-sm text-muted">
              {topGap
                ? `Not cited on "${topGap.prompt}" — prioritize comparison and FAQ content for this buyer question.`
                : "Your strongest prompt can be reused as the template for adjacent comparison coverage."}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {rankedBrands.map((brand) => {
          const leading = (brand.deltaVsYou ?? 0) > 0;
          const trailing = (brand.deltaVsYou ?? 0) < 0;
          const isYou = brand.brand === yourBrand;
          const rank = rankMap.get(brand.brand) ?? 1;
          const promptShare = prompts.length
            ? Math.round((brand.promptsLed / prompts.length) * 100)
            : 0;
          const positionLabel = isYou
            ? "Your baseline"
            : leading
              ? "Ahead of you"
              : trailing
                ? "Behind you"
                : "At parity";
          const positionTone = isYou
            ? "bg-ink text-white"
            : leading
              ? "bg-red-50 text-red-700"
              : trailing
                ? "bg-emerald-50 text-emerald-700"
                : "bg-surface text-muted";

          return (
            <div
              key={brand.brand}
              className={`relative overflow-hidden rounded-2xl border px-5 py-4 shadow-sm transition ${
                isYou
                  ? "border-[#cbd6ff] bg-[linear-gradient(180deg,rgba(123,147,240,0.1),rgba(255,255,255,0.96))]"
                  : "border-border bg-surface/70"
              }`}
            >
              <div
                className={`pointer-events-none absolute inset-x-0 top-0 h-10 ${
                  isYou
                    ? "bg-gradient-to-b from-accent/10 to-transparent"
                    : "bg-gradient-to-b from-white/70 to-transparent"
                }`}
              />
              <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1.4fr)_120px_120px_minmax(0,1.1fr)_auto] lg:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-semibold text-ink">{brand.brand}</p>
                    {isYou && (
                      <span className="rounded-full bg-ink px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                        You
                      </span>
                    )}
                    <span className="rounded-full border border-border bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
                      {benchmarkRankLabel(rank)}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <div className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-muted">
                        <span>Visibility strength</span>
                        <span>{formatScore(brand.avgVisibility)}/100</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white">
                        <div
                          className={`h-full rounded-full ${
                            isYou ? "bg-gradient-to-r from-[#7b93f0] to-accent" : "bg-ink/75"
                          }`}
                          style={{ width: benchmarkBarWidth(brand.avgVisibility) }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-muted">
                        <span>Prompt share</span>
                        <span>{promptShare}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white">
                        <div
                          className={`h-full rounded-full ${
                            isYou ? "bg-gradient-to-r from-mint to-glow" : "bg-ink/50"
                          }`}
                          style={{ width: benchmarkBarWidth(promptShare) }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border/80 bg-white/80 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                    Avg visibility
                  </p>
                  <p className="mt-1 font-display text-3xl font-bold text-ink">
                    {formatScore(brand.avgVisibility)}
                  </p>
                </div>

                <div className="rounded-xl border border-border/80 bg-white/80 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                    Prompts led
                  </p>
                  <p className="mt-1 font-display text-3xl font-bold text-ink">
                    {brand.promptsLed}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 lg:justify-center">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${positionTone}`}
                  >
                    {positionLabel}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${benchmarkDeltaTone(
                      brand.deltaVsYou,
                    )}`}
                  >
                    {brand.deltaVsYou === null
                      ? "Not measured"
                      : brand.deltaVsYou > 0
                        ? `+${brand.deltaVsYou} vs you`
                        : brand.deltaVsYou < 0
                          ? `${brand.deltaVsYou} vs you`
                          : "Benchmark"}
                  </span>
                </div>

                <div className="text-left lg:text-right">
                  <span className="rounded-full border border-border bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
                    {promptShare}% prompt share
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 space-y-3">
        {prompts.map((prompt) => {
          const sortedScores = [...prompt.scores].sort(
            (a, b) => (b.score ?? -1) - (a.score ?? -1),
          );
          const youScore =
            prompt.scores.find((item) => item.brand === yourBrand)?.score ?? prompt.yourScore;
          const yourPromptRank =
            sortedScores.findIndex((item) => item.brand === yourBrand) + 1 || 1;
          const leaderScore = sortedScores[0]?.score ?? youScore;
          const state = benchmarkPromptState(prompt, yourBrand);

          return (
            <div
              key={prompt.prompt}
              className="relative overflow-hidden rounded-2xl border border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.95))] px-5 py-4 shadow-sm"
            >
              <div className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${state.rail}`} />
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-ink">{prompt.prompt}</p>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${state.tone}`}
                    >
                      {state.label}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {prompt.youCited
                      ? `Your brand is cited on this prompt (${youScore ?? 0}% cite signal).`
                      : `Not cited on this prompt — ${prompt.leader} is the inferred leader from audit settings.`}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-full border border-border bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
                      {prompt.leader}
                    </span>
                    <span className="rounded-full border border-border bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
                      {prompt.youCited ? "Cited" : "Not cited"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink">
                    Your rank #{yourPromptRank}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                      prompt.youCited
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-800"
                    }`}
                  >
                    {prompt.youCited ? "Cited in audit" : "Needs coverage"}
                  </span>
                </div>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-muted">{state.summary}</p>

              <div className="mt-4 grid gap-3 xl:grid-cols-4">
                {sortedScores.map((score) => {
                  const isLeader = score.brand === prompt.leader;
                  const isYou = score.brand === yourBrand;

                  return (
                    <div
                      key={score.brand}
                      className={`rounded-xl border px-4 py-3 transition ${
                        isLeader
                          ? "border-[#cbd6ff] bg-white shadow-sm"
                          : isYou
                            ? "border-mint/25 bg-white/85"
                            : "border-border/80 bg-white/75"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-ink">{score.brand}</p>
                          <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
                            {isLeader
                              ? "Prompt leader"
                              : isYou
                                ? `Rank #${yourPromptRank}`
                                : score.score === null
                                  ? "Not measured"
                                  : `${Math.max(0, (leaderScore ?? 0) - score.score)} pts off lead`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-display text-[1.75rem] font-bold leading-none text-ink">
                            {formatScore(score.score)}
                          </p>
                          {(isLeader || isYou) && (
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                                isLeader
                                  ? "bg-ink text-white"
                                  : "bg-surface text-muted"
                              }`}
                            >
                              {isLeader ? "Lead" : "You"}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface">
                        <div
                          className={`h-full rounded-full ${
                            isLeader
                              ? "bg-gradient-to-r from-[#7b93f0] to-accent"
                              : isYou
                                ? "bg-gradient-to-r from-mint to-glow"
                                : "bg-ink/50"
                          }`}
                          style={{ width: benchmarkBarWidth(score.score) }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function PromptsCard({ workspace }: { workspace: WorkspaceSnapshot }) {
  return (
    <div className="rounded-2xl border border-white/80 bg-white/90 px-5 py-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
        Prompts tracked
      </p>
      <div className="mt-2 flex items-end justify-between gap-4">
        <p className="font-display text-4xl font-bold text-ink">
        {workspace.promptsTracked}/5
        </p>
        <span className="rounded-full bg-mint/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-mint">
          Money prompts
        </span>
      </div>
      <p className="mt-2 text-sm text-muted">
        Track high-intent buyer questions, not generic topic coverage.
      </p>
    </div>
  );
}

function PromptTable({
  rows,
  hasRealAudit,
}: {
  rows: PromptRow[];
  hasRealAudit: boolean;
}) {
  if (hasRealAudit && rows.length === 0) {
    return (
      <p className="mt-6 text-sm text-muted">
        No prompt results in the latest audit. Re-run a citation audit to refresh this table.
      </p>
    );
  }

  if (!hasRealAudit) {
    return (
      <p className="mt-6 text-sm text-muted">
        Run a citation audit to populate prompt-level visibility from live or technical checks.
      </p>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      {rows.map((row) => (
        <div
          key={row.prompt}
          className="rounded-2xl border border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.96))] px-5 py-4 shadow-sm"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="font-semibold text-ink">{row.prompt}</p>
              <p className="mt-1 text-sm text-muted">
                {row.leader === "You"
                  ? "Your brand currently leads this tracked prompt."
                  : `${row.leader} currently leads this tracked prompt.`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink shadow-sm">
                {row.visibility === null
                  ? "—"
                  : row.fromAudit
                    ? row.cited
                      ? "Cited"
                      : "Not cited"
                    : `Visibility ${row.visibility}%`}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${sentimentStyle[row.sentiment]}`}
              >
                {row.sentiment}
              </span>
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[1.3fr_0.9fr_0.8fr]">
            <div className="rounded-xl border border-border/80 bg-surface/60 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                Visible in
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {row.models.map((m) => (
                  <span
                    key={m}
                    className="rounded-full border border-border bg-white px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-muted"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border/80 bg-surface/60 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                Prompt leader
              </p>
              <p className="mt-2 font-semibold text-ink">{row.leader}</p>
            </div>

            <div className="rounded-xl border border-border/80 bg-surface/60 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                Strength
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#7b93f0] via-accent to-glow"
                  style={{
                    width:
                      row.visibility === null
                        ? "0%"
                        : `${Math.max(8, Math.min(100, row.visibility))}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

