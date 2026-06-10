"use client";

import Link from "next/link";
import { useMemo } from "react";
import { DashboardWidgetGrid } from "@/components/dashboard/copilot/DashboardWidgetGrid";
import { CopilotDashboardPrompt } from "@/components/dashboard/copilot/CopilotDashboardPrompt";
import { DashboardCard } from "@/components/dashboard/layout/DashboardCard";
import { GettingStartedChecklist } from "@/components/dashboard/GettingStartedChecklist";
import { DashboardOverviewLead } from "@/components/dashboard/overview/DashboardOverviewLead";
import { DashboardPageSkeleton } from "@/components/dashboard/layout/DashboardPageSkeleton";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { PLATFORMS } from "@/lib/dashboard";
import { buildWorkspaceSnapshot } from "@/lib/dashboard";
import {
  platformRowsFromWorkspace,
  promptRowsForWorkspace,
} from "@/lib/dashboard-data";
import {
  DashboardGaugeChart,
  DashboardLineChart,
  DashboardRingChart,
  DashboardSparkline,
} from "@/components/charts/DashboardCharts";
import { GscConnectCard } from "@/components/dashboard/GscConnectCard";
import { CHART_COLORS } from "@/lib/charts/theme";
import { useGscMetrics } from "@/hooks/useGscMetrics";
import {
  auditStatus,
  citationTrendStatus,
} from "@/lib/dashboard-data-status";

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const FALLBACK_WORKSPACE = buildWorkspaceSnapshot({});

export function MyDashboardOverview() {
  const { workspace, ready } = useWorkspaceContext();
  const activeWorkspace = workspace ?? FALLBACK_WORKSPACE;
  const workspaceId = activeWorkspace.workspaceId ?? activeWorkspace.id;
  const { metrics: gsc, connected: gscConnected } = useGscMetrics(workspaceId);

  const platformRows = useMemo(
    () => platformRowsFromWorkspace(activeWorkspace, PLATFORMS),
    [activeWorkspace],
  );
  const promptRows = useMemo(
    () => promptRowsForWorkspace(activeWorkspace),
    [activeWorkspace],
  );

  const citedCount = platformRows.filter((p) => p.cited).length;
  const history = activeWorkspace.citationHistory ?? [];
  const historyValues = useMemo(
    () =>
      history.length > 0
        ? history.map((h) => Math.round(h.visibilityIndex))
        : [
            activeWorkspace.citationScore - 8,
            activeWorkspace.citationScore - 4,
            activeWorkspace.citationScore,
          ],
    [history, activeWorkspace.citationScore],
  );

  const historyLabels = useMemo(() => {
    if (history.length > 0) {
      return history.map((point, index, all) => {
        const parsed = new Date(point.recordedAt);
        if (Number.isNaN(parsed.getTime())) return `Audit ${index + 1}`;
        return parsed.toLocaleDateString("en-US", {
          month: "short",
          day: all.length <= 6 ? "numeric" : undefined,
        });
      });
    }
    return historyValues.map((_, i) => `W${i + 1}`);
  }, [history, historyValues]);

  const gscDaily = gsc?.daily ?? [];
  const gscChartLabels = useMemo(
    () =>
      gscDaily.map((point) => {
        const parsed = new Date(`${point.date}T12:00:00`);
        if (Number.isNaN(parsed.getTime())) return point.date;
        return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      }),
    [gscDaily],
  );

  const auditDataStatus = auditStatus(activeWorkspace);
  const trendDataStatus = citationTrendStatus(activeWorkspace);

  if (!ready) {
    return <DashboardPageSkeleton />;
  }

  const keywordBuckets = [
    {
      label: "Cited",
      value: promptRows.filter((r) => r.cited).length,
      delta: "+",
      spark: [2, 3, 4, 5, promptRows.filter((r) => r.cited).length],
    },
    {
      label: "Top platforms",
      value: citedCount,
      delta: citedCount > 0 ? `+${citedCount}` : "0",
      spark: [1, 2, citedCount, citedCount, citedCount],
    },
    {
      label: "Tracked",
      value: activeWorkspace.promptsTracked,
      delta: String(activeWorkspace.promptsTracked),
      spark: [1, 2, 3, activeWorkspace.promptsTracked, activeWorkspace.promptsTracked],
    },
    {
      label: "Gaps",
      value: activeWorkspace.gaps.length || 3,
      delta: activeWorkspace.gaps.length ? `-${activeWorkspace.gaps.length}` : "-3",
      spark: [5, 4, 3, 2, activeWorkspace.gaps.length || 3],
    },
  ];

  const topPrompts = promptRows.slice(0, 5);
  const moneyPromptList = (
    topPrompts.length
      ? topPrompts
      : [{ prompt: activeWorkspace.buyerQuestion, cited: false }]
  ).slice(0, 5);

  return (
    <div className="space-y-5 pb-8">
      <DashboardOverviewLead workspace={activeWorkspace} />

      {/* First-run CTA — shown prominently before any data cards */}
      {!activeWorkspace.hasRealAudit && (
        <div className="rounded-2xl border border-dashed border-accent/40 bg-accent/5 p-6 text-center">
          <p className="font-display text-lg font-bold text-ink">Run your first audit for live data</p>
          <p className="mt-2 text-sm text-muted">
            Charts below use workspace estimates until a GEO audit completes.
          </p>
          <Link
            href="/audit"
            className="mt-4 inline-flex rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-deep"
          >
            Run citation audit →
          </Link>
        </div>
      )}

      <GettingStartedChecklist workspace={activeWorkspace} welcome={false} />

      <CopilotDashboardPrompt />
      <DashboardWidgetGrid workspace={activeWorkspace} />

      {/* Position Tracking */}
      <DashboardCard
        title="Citation position tracking"
        action="Last 90 days"
        dataStatus={auditDataStatus}
        className="overflow-hidden"
      >
        {/* Top row: gauge + 4 stat tiles */}
        <div className="grid gap-5 sm:grid-cols-[auto_1fr]">
          {/* Gauge */}
          <div className="flex flex-col items-center justify-center rounded-2xl bg-surface p-5 sm:min-w-[180px]">
            <DashboardGaugeChart
              value={activeWorkspace.citationScore}
              label="Citation health"
              size="lg"
            />
            <div className="mt-3 flex flex-col gap-1.5 text-[11px] text-muted">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-accent" aria-hidden /> Your site
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#a78bfa]" aria-hidden /> Top 10% sites
              </span>
            </div>
          </div>

          {/* 4 stat tiles */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {keywordBuckets.map((b) => {
              const isNegative = b.label === "Gaps";
              return (
                <div
                  key={b.label}
                  className={`flex flex-col rounded-2xl border p-4 ${
                    isNegative
                      ? "border-amber-200/60 bg-amber-50/50"
                      : "border-border bg-white"
                  }`}
                >
                  <p className="text-[11px] font-medium text-muted">{b.label}</p>
                  <p className={`mt-1.5 text-2xl font-bold ${isNegative ? "text-amber-700" : "text-ink"}`}>
                    {formatCompact(b.value)}
                  </p>
                  <p className={`text-xs font-semibold ${isNegative ? "text-amber-500" : "text-accent"}`}>
                    {b.delta}
                  </p>
                  <div className="mt-2 flex-1">
                    <DashboardSparkline values={b.spark} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom row: prompt table */}
        <div className="mt-5 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[420px] text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-surface/60">
                <th className="px-4 py-3 font-semibold text-muted">Money prompt</th>
                <th className="px-4 py-3 font-semibold text-muted">Status</th>
                <th className="px-4 py-3 font-semibold text-muted">Leader</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(topPrompts.length
                ? topPrompts
                : [{ prompt: activeWorkspace.buyerQuestion, cited: false, leader: "—" }]
              ).map((row) => (
                <tr key={row.prompt} className="bg-white transition-colors hover:bg-surface/60">
                  <td className="px-4 py-3 pr-2 font-medium text-ink">
                    {row.prompt.length > 52 ? `${row.prompt.slice(0, 52)}…` : row.prompt}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        row.cited
                          ? "bg-accent/10 text-accent-deep"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${row.cited ? "bg-accent" : "bg-amber-400"}`}
                        aria-hidden
                      />
                      {row.cited ? "Cited" : "Gap"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{row.leader ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardCard>

      {/* Row 2 */}
      <div className="grid gap-5 lg:grid-cols-2">
        <DashboardCard title="Platform overview" dataStatus={auditDataStatus}>
          <div className="flex flex-wrap items-center justify-around gap-4 border-b border-border pb-5">
            <DashboardRingChart
              value={activeWorkspace.domainRating || activeWorkspace.citationScore}
              label="DR"
            />
            <DashboardRingChart
              value={activeWorkspace.visibilityScore || citedCount * 12}
              label="Visibility"
            />
            <DashboardRingChart
              value={Math.round((citedCount / PLATFORMS.length) * 100)}
              label="Coverage"
            />
          </div>
          <div className="mt-4">
            <DashboardLineChart
              height={112}
              labels={historyLabels}
              series={[
                { label: "Score", values: historyValues, color: CHART_COLORS.primary },
                ...(history.length < 2
                  ? [
                      {
                        label: "Prior",
                        values: historyValues.map((v) => Math.max(0, v - 6)),
                        color: CHART_COLORS.muted,
                        dashed: true,
                      },
                    ]
                  : []),
              ]}
            />
          </div>
        </DashboardCard>

        <DashboardCard
          title="Sessions & engagement"
          action="View full report"
          actionHref="/dashboard/analytics"
          dataStatus={auditDataStatus}
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { label: "Platforms cited", value: `${citedCount}/${PLATFORMS.length}` },
              { label: "Prompts tracked", value: String(activeWorkspace.promptsTracked) },
              { label: "Content drafts", value: String(activeWorkspace.contentDrafts) },
              { label: "Backlink sources", value: String(activeWorkspace.sourceCount) },
              { label: "Community", value: String(activeWorkspace.communityMentions) },
              { label: "Weekly lift", value: activeWorkspace.weeklyLiftAvailable ? activeWorkspace.weeklyLift : "—" },
            ].map((m) => (
              <div key={m.label}>
                <p className="text-[11px] text-muted">{m.label}</p>
                <p className="text-lg font-bold text-ink">{m.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <DashboardLineChart
              labels={historyLabels}
              series={[{ label: "Citations", values: historyValues, color: CHART_COLORS.primary }]}
              height={96}
            />
          </div>
        </DashboardCard>
      </div>

      {/* Row 3 */}
      <div className={`grid gap-5 ${gscConnected ? "xl:grid-cols-[2fr_1fr]" : ""}`}>
        {gscConnected && gsc ? (
          <DashboardCard
            title="Google Search Console performance"
            action="Last 28 days"
            dataStatus="live"
          >
            <div className="grid gap-4 sm:grid-cols-4">
              {[
                { label: "Clicks", value: gsc.clicks, delta: gsc.clicksDelta ?? "—" },
                { label: "Impressions", value: gsc.impressions, delta: gsc.impressionsDelta ?? "—" },
                { label: "CTR", value: `${(gsc.ctr * 100).toFixed(2)}%`, delta: "—" },
                { label: "Avg position", value: gsc.position.toFixed(1), delta: "—" },
              ].map((m) => (
                <div key={m.label} className="rounded-xl border border-border p-3">
                  <p className="text-[11px] text-muted">{m.label}</p>
                  <p className="mt-1 text-lg font-bold text-ink">
                    {typeof m.value === "number" ? formatCompact(m.value) : m.value}
                  </p>
                  <p className="text-xs text-accent">{m.delta}</p>
                </div>
              ))}
            </div>
            {gscDaily.length > 0 && (
              <div className="mt-4">
                <DashboardLineChart
                  labels={gscChartLabels}
                  series={[
                    { label: "Clicks", values: gscDaily.map((d) => d.clicks), color: CHART_COLORS.primary },
                    {
                      label: "Impressions",
                      values: gscDaily.map((d) => d.impressions),
                      color: CHART_COLORS.secondary,
                      dashed: true,
                    },
                  ]}
                  height={140}
                  showLegend
                />
              </div>
            )}
          </DashboardCard>
        ) : (
          <GscConnectCard workspaceId={workspaceId} />
        )}

        <DashboardCard title="Visibility" dataStatus={auditDataStatus}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-3xl font-bold text-ink">
                {(activeWorkspace.visibilityScore || activeWorkspace.citationScore * 0.4).toFixed(1)}%
                <span className="ml-1 text-sm font-medium text-accent">
                  {activeWorkspace.weeklyLiftAvailable ? activeWorkspace.weeklyLift : "—"}
                </span>
              </p>
              <p className="mt-1 text-xs text-muted">AI answer share</p>
            </div>
            <span className="rounded-full bg-accent/10 px-2 py-1 text-[11px] font-semibold text-accent-deep">
              Rank ↑ {Math.max(1, 30 - activeWorkspace.citationScore / 3)}
            </span>
          </div>
          <div className="mt-4 rounded-xl bg-gradient-to-t from-accent/10 to-transparent p-2">
            <DashboardLineChart
              labels={historyLabels}
              series={[{ label: "Visibility", values: historyValues, color: CHART_COLORS.secondary }]}
              height={88}
            />
          </div>
        </DashboardCard>
      </div>

      {/* Row 4 */}
      <DashboardCard
        title="Top money prompts"
        action="View full report"
        actionHref="/dashboard/content"
        dataStatus={topPrompts.length > 0 ? auditDataStatus : "demo"}
      >
        <ul className="divide-y divide-border">
          {moneyPromptList.map((row) => (
            <li key={row.prompt} className="flex items-center justify-between gap-3 py-3 first:pt-0">
              <span className="text-sm text-ink">{row.prompt}</span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  row.cited ? "bg-accent/10 text-accent-deep" : "bg-amber-50 text-amber-800"
                }`}
              >
                {row.cited ? "Cited" : "Gap"}
              </span>
            </li>
          ))}
        </ul>
      </DashboardCard>

      {/* Row 5 */}
      <div className={`grid gap-5 ${gscConnected ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
        <DashboardCard
          title="Platform presence"
          action="View full report"
          actionHref="/dashboard/geo-audit"
          dataStatus={auditDataStatus}
        >
          <div className="mb-3 flex gap-3 text-[11px] text-muted">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-accent" /> Cited</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-border" /> Missing</span>
          </div>
          {platformRows.slice(0, 4).map((p) => (
            <div key={p.name} className="mb-2 flex items-center gap-2">
              <span className="w-20 truncate text-xs text-muted">{p.name}</span>
              <div className="flex h-2 flex-1 overflow-hidden rounded-full bg-border">
                <div
                  className={`h-full ${p.cited ? "bg-accent" : "bg-[#cbd5e1]"}`}
                  style={{ width: p.cited ? `${p.share ?? 70}%` : "100%" }}
                />
              </div>
            </div>
          ))}
        </DashboardCard>

        {gscConnected && gsc && (
          <DashboardCard
            title="Impressions & clicks"
            action="View full report"
            actionHref="/dashboard/analytics"
            dataStatus="live"
          >
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-muted">Impressions</p>
                <p className="text-xl font-bold text-ink">{formatCompact(gsc.impressions)}</p>
                {gsc.impressionsDelta && (
                  <p className="mt-1 text-xs text-accent">{gsc.impressionsDelta} vs prior 28d</p>
                )}
              </div>
              <div>
                <p className="text-muted">URL clicks</p>
                <p className="text-xl font-bold text-ink">{formatCompact(gsc.clicks)}</p>
                {gsc.clicksDelta && (
                  <p className="mt-1 text-xs text-accent">{gsc.clicksDelta} vs prior 28d</p>
                )}
              </div>
            </div>
          </DashboardCard>
        )}

        <DashboardCard
          title={`Related prompts ${promptRows.length || 1}`}
          action="View full report"
          actionHref="/dashboard/analytics"
          dataStatus={topPrompts.length > 0 ? auditDataStatus : "demo"}
        >
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-muted">
                <th className="pb-2">Prompt</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {(topPrompts.length ? topPrompts : [{ prompt: activeWorkspace.buyerQuestion, cited: false }]).slice(0, 4).map((r) => (
                <tr key={r.prompt} className="border-t border-surface">
                  <td className="py-2 pr-2 text-ink">{r.prompt.slice(0, 24)}…</td>
                  <td className="py-2 text-muted">{r.cited ? "Cited" : "Gap"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DashboardCard>
      </div>

      {/* Row 6 */}
      <div className="grid gap-5 xl:grid-cols-[2fr_1fr]">
        <DashboardCard title="Citation trend" action="Last 30 days" dataStatus={trendDataStatus}>
          <div className="space-y-4">
            <div>
              <p className="mb-1 text-xs text-muted">Citation score</p>
              <DashboardLineChart
                labels={historyLabels}
                series={[{ label: "Score", values: historyValues, color: CHART_COLORS.primary }]}
                height={100}
              />
            </div>
            <div>
              <p className="mb-1 text-xs text-muted">Platforms cited</p>
              <DashboardLineChart
                labels={historyLabels}
                series={[
                  {
                    label: "Platforms",
                    values: historyValues.map((v) => Math.round(v / 15)),
                    color: CHART_COLORS.secondary,
                  },
                ]}
                height={100}
              />
            </div>
          </div>
        </DashboardCard>

        <div className={`grid gap-5 ${gscConnected ? "sm:grid-cols-2 xl:grid-cols-1" : ""}`}>
          {gscConnected && gsc && (
            <DashboardCard title="Organic search" dataStatus="live">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] text-muted">Clicks (28d)</p>
                  <p className="text-xl font-bold text-ink">{formatCompact(gsc.clicks)}</p>
                  {gsc.clicksDelta && (
                    <p className="text-xs text-accent">{gsc.clicksDelta} vs prior period</p>
                  )}
                </div>
                <div>
                  <p className="text-[11px] text-muted">Impressions (28d)</p>
                  <p className="text-xl font-bold text-ink">{formatCompact(gsc.impressions)}</p>
                  {gsc.impressionsDelta && (
                    <p className="text-xs text-accent">{gsc.impressionsDelta} vs prior period</p>
                  )}
                </div>
              </div>
            </DashboardCard>
          )}
          <DashboardCard title="AI citations" dataStatus={auditDataStatus}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] text-muted">Score</p>
                <p className="text-xl font-bold text-ink">{activeWorkspace.citationScore}</p>
                <p className="text-xs text-accent">
                  {activeWorkspace.weeklyLiftAvailable ? activeWorkspace.weeklyLift : "—"}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-muted">Platforms cited</p>
                <p className="text-xl font-bold text-ink">
                  {citedCount}/{PLATFORMS.length}
                </p>
                <p className="text-xs text-muted">
                  {activeWorkspace.hasRealAudit ? "From latest audit" : "Run audit"}
                </p>
              </div>
            </div>
          </DashboardCard>
        </div>
      </div>
    </div>
  );
}
