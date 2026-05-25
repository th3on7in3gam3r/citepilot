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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-full border border-border bg-white p-1">
          <TabButton active={tab === "google"} onClick={() => setTab("google")}>
            Google
          </TabButton>
          <TabButton active={tab === "llms"} onClick={() => setTab("llms")}>
            LLMs
          </TabButton>
        </div>
        <select className="rounded-full border border-border bg-white px-4 py-2 text-sm text-muted">
          <option>Last 30 days</option>
          <option>Last 90 days</option>
        </select>
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
        active ? "bg-ink text-white" : "text-muted hover:text-ink"
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
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              Visibility score
            </p>
            <p className="font-display mt-1 text-3xl font-bold text-ink">
              {workspace.visibilityScore}%
            </p>
          </div>
          <PromptsCard workspace={workspace} />
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="max-w-3xl text-sm leading-relaxed text-muted">
            Directional insights inferred from your latest prompt leadership, AI
            platform coverage, and technical audit signals. These are not strict
            causal claims, but they do highlight which fixes most likely explain or
            unlock visibility changes.
          </p>
        </div>
      </div>

      {insights.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-surface/60 px-5 py-5">
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
              className="rounded-xl border border-border bg-surface px-5 py-4"
            >
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
        <div className="rounded-xl border border-dashed border-border bg-surface/60 px-5 py-5">
          <p className="text-sm font-semibold text-ink">
            Add competitors to unlock side-by-side benchmarking.
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            CitePilot can compare your tracked prompts against up to three competitors
            so you can see where you lead, where they lead, and which comparison
            prompts to prioritize next.
          </p>
          <Link
            href="/dashboard/settings"
            className="mt-4 inline-flex rounded-full border border-border bg-white px-4 py-2 text-xs font-semibold text-ink transition hover:bg-surface"
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

  return (
    <Panel title="Competitor benchmark" className="mt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm leading-relaxed text-muted">
            Side-by-side prompt benchmarking for your domain and up to three tracked
            competitors. This first pass uses your current prompt leadership and
            visibility signals to estimate where each brand is winning.
          </p>
        </div>
        {topGap && (
          <div className="rounded-full bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-800">
            Biggest gap: {topGap.leader} leads by {topGap.gapToLeader} pts
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {brands.map((brand) => {
          const leading = brand.deltaVsYou > 0;
          const trailing = brand.deltaVsYou < 0;
          return (
            <div
              key={brand.brand}
              className="rounded-xl border border-border bg-surface px-5 py-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    {brand.brand === yourBrand ? "Your brand" : "Competitor"}
                  </p>
                  <p className="mt-1 font-semibold text-ink">{brand.brand}</p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    leading
                      ? "bg-red-50 text-red-700"
                      : trailing
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-surface text-muted"
                  }`}
                >
                  {brand.deltaVsYou > 0
                    ? `+${brand.deltaVsYou} vs you`
                    : brand.deltaVsYou < 0
                      ? `${brand.deltaVsYou} vs you`
                      : "Baseline"}
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Avg visibility
                  </p>
                  <p className="mt-1 font-display text-3xl font-bold text-ink">
                    {brand.avgVisibility}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Prompts led
                  </p>
                  <p className="mt-1 font-display text-3xl font-bold text-ink">
                    {brand.promptsLed}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider text-muted">
              <th className="pb-3 pr-4">Prompt</th>
              {brands.map((brand) => (
                <th key={brand.brand} className="pb-3 pr-4">
                  {brand.brand}
                </th>
              ))}
              <th className="pb-3 pr-4">Leader</th>
              <th className="pb-3">Gap</th>
            </tr>
          </thead>
          <tbody>
            {prompts.map((prompt) => (
              <tr
                key={prompt.prompt}
                className="border-b border-border align-top last:border-0"
              >
                <td className="max-w-xs py-4 pr-4 font-medium text-ink">
                  {prompt.prompt}
                </td>
                {brands.map((brand) => {
                  const score =
                    prompt.scores.find((item) => item.brand === brand.brand)?.score ?? 0;
                  const isLeader = prompt.leader === brand.brand;
                  const isYou = brand.brand === yourBrand;
                  return (
                    <td key={brand.brand} className="py-4 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-ink">{score}</span>
                        {isLeader && (
                          <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                            Lead
                          </span>
                        )}
                        {isYou && !isLeader && score > 0 && (
                          <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                            You
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
                <td className="py-4 pr-4 text-muted">{prompt.leader}</td>
                <td className="py-4 text-muted">
                  {prompt.gapToLeader > 0 ? `${prompt.gapToLeader} pts` : "Leading"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function PromptsCard({ workspace }: { workspace: WorkspaceSnapshot }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
        Prompts tracked
      </p>
      <p className="font-display mt-1 text-3xl font-bold text-ink">
        {workspace.promptsTracked}/5
      </p>
    </div>
  );
}

function PromptTable({ rows }: { rows: PromptRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider text-muted">
            <th className="pb-3 pr-4">Prompts</th>
            <th className="pb-3 pr-4">Visibility</th>
            <th className="pb-3 pr-4">Visible in</th>
            <th className="pb-3 pr-4">Sentiment</th>
            <th className="pb-3">Leader</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.prompt} className="border-b border-border last:border-0">
              <td className="max-w-xs py-4 pr-4 font-medium text-ink">{row.prompt}</td>
              <td className="py-4 pr-4">{row.visibility}%</td>
              <td className="py-4 pr-4">
                <div className="flex gap-1">
                  {row.models.map((m) => (
                    <span
                      key={m}
                      className="rounded-md bg-surface px-1.5 py-0.5 text-xs font-bold text-muted"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </td>
              <td className="py-4 pr-4">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${sentimentStyle[row.sentiment]}`}
                >
                  {row.sentiment}
                </span>
              </td>
              <td className="py-4 text-muted">{row.leader}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

