"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { CitationVolumeChart } from "@/components/dashboard/CitationVolumeChart";
import { GoogleAnalyticsPanel } from "@/components/dashboard/GoogleAnalyticsPanel";
import { Panel } from "@/components/dashboard/DashboardUI";
import type { WorkspaceSnapshot } from "@/lib/dashboard";
import { domainSeed } from "@/lib/dashboard";
import type { PromptRow } from "@/lib/features";
import {
  buildCompetitorBenchmark,
  buildCorrelationInsights,
  promptRowsForWorkspace,
  type BenchmarkBrandRow,
  type BenchmarkPromptRow,
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

function benchmarkBarWidth(value: number) {
  return `${Math.max(8, Math.min(100, value))}%`;
}

function benchmarkRankLabel(rank: number) {
  if (rank === 1) return "Leader";
  if (rank === 2) return "Challenger";
  return `Rank #${rank}`;
}

function benchmarkDeltaTone(delta: number) {
  if (delta > 0) return "bg-red-50 text-red-700";
  if (delta < 0) return "bg-emerald-50 text-emerald-700";
  return "bg-surface text-muted";
}

function benchmarkPromptState(prompt: BenchmarkPromptRow, yourBrand: string) {
  if (prompt.leader === yourBrand) {
    return {
      label: "Defend lead",
      tone: "bg-emerald-50 text-emerald-700",
      rail: "from-emerald-400 via-mint to-glow",
      summary: "You already lead here. Protect it with freshness and stronger proof assets.",
    };
  }

  if (prompt.gapToLeader <= 6) {
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
  const [tab, setTab] = useState<Tab>("llms");
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
      <div className="overflow-hidden rounded-2xl border border-border bg-[linear-gradient(135deg,rgba(123,147,240,0.08),rgba(255,255,255,0.98),rgba(34,211,238,0.06))] p-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
              Analytics workspace
            </p>
            <p className="mt-1 text-sm text-muted">
              Switch between AI visibility intelligence and Google Search Console
              performance for <span className="font-semibold text-ink">{workspace.domain}</span>.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <div className="inline-flex rounded-full border border-white/80 bg-white/90 p-1 shadow-sm">
          <TabButton active={tab === "google"} onClick={() => setTab("google")}>
            Google
          </TabButton>
          <TabButton active={tab === "llms"} onClick={() => setTab("llms")}>
            LLMs
          </TabButton>
            </div>
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
        <GoogleAnalyticsPanel workspace={workspace} />
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

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        active
          ? "bg-gradient-to-r from-[#7b93f0] via-[#6b8cff] to-accent text-white shadow-[0_8px_20px_rgba(107,140,255,0.28)]"
          : "text-muted hover:text-ink"
      }`}
    >
      {children}
    </button>
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
  benchmark: {
    brands: BenchmarkBrandRow[];
    prompts: BenchmarkPromptRow[];
  };
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
        <PromptTable rows={rows} />
      </Panel>
      <CompetitorBenchmarkPanel
        workspace={workspace}
        brands={benchmark.brands}
        prompts={benchmark.prompts}
      />
      <div className="mt-6">
        <CitationVolumeChart
          seed={domainSeed(workspace.domain)}
          citationScore={workspace.citationScore}
          hasRealAudit={workspace.hasRealAudit}
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
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink">
                  Est. lift {insight.estimatedLift}
                </span>
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
  brands,
  prompts,
}: {
  workspace: WorkspaceSnapshot;
  brands: BenchmarkBrandRow[];
  prompts: BenchmarkPromptRow[];
}) {
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
    .filter((prompt) => prompt.gapToLeader > 0)
    .sort((a, b) => b.gapToLeader - a.gapToLeader)[0];
  const yourBrand = brands[0]?.brand ?? workspace.domain;
  const rankedBrands = [...brands].sort((a, b) => {
    if (b.avgVisibility !== a.avgVisibility) return b.avgVisibility - a.avgVisibility;
    return b.promptsLed - a.promptsLed;
  });
  const rankMap = new Map(rankedBrands.map((brand, index) => [brand.brand, index + 1]));
  const yourRank = rankMap.get(yourBrand) ?? 1;
  const leaderBrand = rankedBrands[0] ?? brands[0];
  const yourAverage = brands.find((brand) => brand.brand === yourBrand)?.avgVisibility ?? 0;
  const leaderGap = Math.max(0, (leaderBrand?.avgVisibility ?? yourAverage) - yourAverage);
  const promptsWon = prompts.filter((prompt) => prompt.leader === yourBrand).length;
  const promptsBehind = prompts.filter((prompt) => prompt.leader !== yourBrand).length;
  const averageCatchupGap = promptsBehind
    ? Math.round(
        prompts
          .filter((prompt) => prompt.gapToLeader > 0)
          .reduce((sum, prompt) => sum + prompt.gapToLeader, 0) / promptsBehind,
      )
    : 0;
  const strongestPrompt = prompts
    .filter((prompt) => prompt.leader === yourBrand)
    .sort((a, b) => b.yourScore - a.yourScore)[0];
  const summaryHeadline =
    leaderBrand?.brand === yourBrand
      ? "You currently lead the competitive benchmark."
      : `${leaderBrand?.brand} currently leads the comparative benchmark.`;

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
              Side-by-side prompt benchmarking for your domain and up to three tracked
              competitors. This view packages prompt leadership, visibility deltas, and
              likely swing opportunities into a cleaner executive-ready scorecard.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-white/80 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink shadow-sm">
              {prompts.length} tracked prompt{prompts.length === 1 ? "" : "s"}
            </span>
            <span className="rounded-full border border-white/80 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink shadow-sm">
              {brands.length} brands compared
            </span>
            {topGap && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-800 shadow-sm">
                Biggest swing: {topGap.gapToLeader} pts
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
              {leaderGap > 0
                ? `${leaderGap} visibility points behind ${leaderBrand?.brand}.`
                : "You currently set the benchmark across tracked prompts."}
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
                ? `Average catch-up need is ${averageCatchupGap || topGap.gapToLeader} points across prompts you do not currently lead.`
                : "Your strongest prompt can be reused as the template for adjacent comparison coverage."}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {rankedBrands.map((brand) => {
          const leading = brand.deltaVsYou > 0;
          const trailing = brand.deltaVsYou < 0;
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
                        <span>{brand.avgVisibility}/100</span>
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
                    {brand.avgVisibility}
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
                    {brand.deltaVsYou > 0
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
          const sortedScores = [...prompt.scores].sort((a, b) => b.score - a.score);
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
                    {prompt.leader === yourBrand
                      ? `You lead this prompt with a score of ${youScore}.`
                      : `${prompt.leader} leads this prompt by ${prompt.gapToLeader} points.`}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-full border border-border bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
                      {prompt.leader}
                    </span>
                    <span className="rounded-full border border-border bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
                      {prompt.gapToLeader > 0
                        ? `${prompt.gapToLeader} pts behind`
                        : "Current leader"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink">
                    Your rank #{yourPromptRank}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                      prompt.gapToLeader > 0
                        ? "bg-amber-50 text-amber-800"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {prompt.gapToLeader > 0
                        ? `${prompt.gapToLeader} pts to flip`
                        : "You already lead"}
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
                                : `${Math.max(0, leaderScore - score.score)} pts off lead`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-display text-[1.75rem] font-bold leading-none text-ink">
                            {score.score}
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

function PromptTable({ rows }: { rows: PromptRow[] }) {
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
                Visibility {row.visibility}%
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
                  style={{ width: `${Math.max(8, Math.min(100, row.visibility))}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

