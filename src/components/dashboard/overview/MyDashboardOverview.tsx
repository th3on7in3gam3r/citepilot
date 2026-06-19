"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PlatformScanBadge } from "@/components/dashboard/PlatformScanBadge";
import { effectInit } from "@/lib/react/effect-init";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { QuickFixModal } from "@/components/dashboard/QuickFixModal";
import { getFixActionLabel } from "@/lib/geo/fixes";
import { CopilotDashboardPrompt } from "@/components/dashboard/copilot/CopilotDashboardPrompt";
import { DashboardCard } from "@/components/dashboard/layout/DashboardCard";
import { DashboardMetricTile } from "@/components/dashboard/layout/DashboardMetricTile";
import {
  DashboardTable,
  DashboardTableBody,
  DashboardTableHead,
  DashboardTableRow,
  DashboardTableTd,
  DashboardTableTh,
} from "@/components/dashboard/layout/DashboardTable";
import { DashboardFilterBar, DashboardFilterSelect, DashboardFilterTabs } from "@/components/dashboard/layout/DashboardToolbar";
import { GettingStartedChecklist } from "@/components/dashboard/GettingStartedChecklist";
import { DashboardWorkspaceEmpty } from "@/components/dashboard/overview/DashboardWorkspaceEmpty";
import { DashboardOverviewLead } from "@/components/dashboard/overview/DashboardOverviewLead";
import { CiteStatusBadge } from "@/components/dashboard/CiteStatusBadge";
import { CiteStatusMilestones } from "@/components/dashboard/CiteStatusMilestones";
import { useCiteStatusCelebration } from "@/hooks/useCiteStatusCelebration";
import { PromptSparkline } from "@/components/dashboard/PromptSparkline";
import { DashboardPageSkeleton } from "@/components/dashboard/layout/DashboardPageSkeleton";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { PLATFORMS } from "@/lib/dashboard";
import {
  DASHBOARD_PERIOD_OPTIONS,
  DASHBOARD_PLATFORM_OPTIONS,
  filterDailyByPeriod,
  filterHistoryByPeriod,
  filterPlatformRows,
  filterPromptRowsByPlatform,
  periodDisplayLabel,
  type DashboardPeriod,
  type DashboardPlatformFilter,
} from "@/lib/dashboard/overview-filters";
import { DashboardWidgetGrid } from "@/components/dashboard/copilot/DashboardWidgetGrid";
import {
  platformRowsFromWorkspace,
  promptRowsForWorkspace,
} from "@/lib/dashboard-data";
import {
  DashboardGaugeChart,
  DashboardLineChart,
  DashboardRingChart,
} from "@/components/charts/DashboardCharts";
import { RosenLineChart } from "@/components/charts/RosenLineChart";
import { RosenHorizontalBarChart } from "@/components/charts/RosenBarChart";
import { GscConnectCard } from "@/components/dashboard/GscConnectCard";
import { WeeklyMonitoringPanel } from "@/components/dashboard/WeeklyMonitoringPanel";
import { CitationTrendPanel } from "@/components/dashboard/CitationTrendPanel";
import { CHART_COLORS } from "@/lib/charts/theme";
import { useGscMetrics } from "@/hooks/useGscMetrics";
import type { WorkspaceSnapshot } from "@/lib/dashboard";
import {
  auditStatus,
  citationTrendStatus,
} from "@/lib/dashboard-data-status";
import type { PromptRow } from "@/lib/features";
import {
  competitorForPrompt,
  promptCitationTrend,
} from "@/lib/dashboard-prompt-trends";

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function DashboardNoWorkspace() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
      <p className="font-display text-lg font-bold text-ink">No workspace yet</p>
      <p className="mt-2 text-sm text-muted">
        Add a site or complete setup to see citation data here — nothing below is
        real until you connect a domain.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/start"
          className="inline-flex rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-deep"
        >
          Start setup →
        </Link>
        <Link
          href="/dashboard/settings"
          className="inline-flex rounded-full border border-border bg-white px-6 py-3 text-sm font-semibold text-ink transition hover:border-accent/40"
        >
          Add site in settings
        </Link>
      </div>
      <div className="mt-8 border-t border-border pt-6">
        <SignOutButton className="text-sm font-semibold text-muted hover:text-ink disabled:opacity-60" />
      </div>
    </div>
  );
}

export function MyDashboardOverview({
  showAgencyBackLink = false,
}: {
  showAgencyBackLink?: boolean;
}) {
  const { workspace, ready } = useWorkspaceContext();

  if (!ready) {
    return <DashboardPageSkeleton />;
  }

  if (!workspace) {
    return <DashboardNoWorkspace />;
  }

  return <MyDashboardOverviewContent workspace={workspace} showAgencyBackLink={showAgencyBackLink} />;
}

function MyDashboardOverviewContent({
  workspace,
  showAgencyBackLink = false,
}: {
  workspace: WorkspaceSnapshot;
  showAgencyBackLink?: boolean;
}) {
  const workspaceId = workspace.workspaceId ?? workspace.id;
  const { metrics: gsc, connected: gscConnected } = useGscMetrics(workspaceId);

  const [selectedGap, setSelectedGap] = useState<string | null>(null);
  const [isFixOpen, setIsFixOpen] = useState(false);
  const [userPlan, setUserPlan] = useState<"free" | "pilot" | "fleet">("free");
  const [promptFilter, setPromptFilter] = useState<"all" | "cited" | "gaps">("all");
  const [periodFilter, setPeriodFilter] = useState<DashboardPeriod>("90d");
  const [platformFilter, setPlatformFilter] = useState<DashboardPlatformFilter>("all");

  useCiteStatusCelebration(workspace);

  effectInit(() => {
    let cancelled = false;
    void fetch("/api/billing/limits", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { prompts?: { plan?: "free" | "pilot" | "fleet" } } | null) => {
        if (!cancelled && data?.prompts?.plan) setUserPlan(data.prompts.plan);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  });

  function handleOpenFix(gapText: string) {
    setSelectedGap(gapText);
    setIsFixOpen(true);
  }

  const platformRows = useMemo(
    () => platformRowsFromWorkspace(workspace, PLATFORMS),
    [workspace],
  );
  const promptRows = useMemo(
    () => promptRowsForWorkspace(workspace),
    [workspace],
  );
  const filteredPlatformRows = useMemo(
    () => filterPlatformRows(platformRows, platformFilter),
    [platformRows, platformFilter],
  );
  const filteredPromptRowsAll = useMemo(
    () => filterPromptRowsByPlatform(promptRows, platformFilter),
    [promptRows, platformFilter],
  );

  const citedCount = filteredPlatformRows.filter((p) => p.cited).length;
  const platformDenominator =
    platformFilter === "all" ? PLATFORMS.length : Math.max(1, filteredPlatformRows.length);
  const history = workspace.citationHistory ?? [];
  const filteredHistory = useMemo(
    () => filterHistoryByPeriod(history, periodFilter),
    [history, periodFilter],
  );
  const historyValues = useMemo(
    () =>
      filteredHistory.length > 0
        ? filteredHistory.map((h) => Math.round(h.visibilityIndex))
        : [
            workspace.citationScore - 8,
            workspace.citationScore - 4,
            workspace.citationScore,
          ],
    [filteredHistory, workspace.citationScore],
  );

  const historyLabels = useMemo(() => {
    if (filteredHistory.length > 0) {
      return filteredHistory.map((point, index, all) => {
        const parsed = new Date(point.recordedAt);
        if (Number.isNaN(parsed.getTime())) return `Audit ${index + 1}`;
        return parsed.toLocaleDateString("en-US", {
          month: "short",
          day: all.length <= 6 ? "numeric" : undefined,
        });
      });
    }
    return historyValues.map((_, i) => `W${i + 1}`);
  }, [filteredHistory, historyValues]);

  const gscDaily = useMemo(
    () => filterDailyByPeriod(gsc?.daily ?? [], periodFilter),
    [gsc?.daily, periodFilter],
  );
  const gscChartLabels = useMemo(
    () =>
      gscDaily.map((point) => {
        const parsed = new Date(`${point.date}T12:00:00`);
        if (Number.isNaN(parsed.getTime())) return point.date;
        return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      }),
    [gscDaily],
  );

  const auditDataStatus = auditStatus(workspace);
  const trendDataStatus = citationTrendStatus(workspace);

  const citedPromptsCount = filteredPromptRowsAll.filter((r) => r.cited).length;
  const trackedCount = workspace.promptsTracked;
  const gapsCount = workspace.gaps.length || 3;

  const citedPlatformNames = useMemo(
    () => filteredPlatformRows.filter((p) => p.cited).map((p) => p.name),
    [filteredPlatformRows],
  );

  const citedPromptsList = useMemo(
    () => promptRows.filter((p) => p.cited).map((p) => p.prompt),
    [promptRows]
  );

  const firstTrackedQuery = workspace.buyerQuestion || "best tool for saas";

  const gapsList = useMemo(
    () =>
      workspace.gaps.length > 0
        ? workspace.gaps
        : [
            "Missing FAQPage schema — high-impact for AI answer extraction",
            "No Organization schema — weakens brand entity recognition",
            "Thin homepage content (<300 words) — add an answer capsule above the fold",
          ],
    [workspace.gaps]
  );

  const keywordBuckets = useMemo(() => {
    return [
      {
        label: "Cited",
        href: "/dashboard/analytics#money-prompts",
        value: citedPromptsCount,
        delta: `${Math.round((citedPromptsCount / Math.max(1, trackedCount)) * 100)}% rate`,
        spark: [2, 3, 4, 5, citedPromptsCount],
        color: "#0ea5e9",
        theme: "sky",
        info: citedPromptsCount > 0 ? (
          <span className="line-clamp-2 leading-relaxed text-slate-600">
            Cited on: <strong className="text-sky-600 font-semibold">&quot;{citedPromptsList[0]}&quot;</strong>
          </span>
        ) : (
          <span className="text-slate-400 italic font-normal">No queries cited yet</span>
        ),
      },
      {
        label: "Top platforms",
        href: "/dashboard/geo-audit#platform-coverage",
        value: citedCount,
        delta: `${citedCount}/${PLATFORMS.length} LLMs`,
        spark: [1, 2, citedCount, citedCount, citedCount],
        color: "#8b5cf6",
        theme: "violet",
        info: citedCount > 0 ? (
          <div className="flex flex-wrap gap-1">
            {citedPlatformNames.slice(0, 3).map((name) => (
              <span
                key={name}
                className="px-1.5 py-0.5 rounded bg-violet-50 text-[9px] font-bold text-violet-600 border border-violet-100/50"
              >
                {name}
              </span>
            ))}
            {citedPlatformNames.length > 3 && (
              <span className="px-1 py-0.5 text-[9px] font-semibold text-slate-400">
                +{citedPlatformNames.length - 3} more
              </span>
            )}
          </div>
        ) : (
          <span className="text-slate-400 italic font-normal">No platforms citing yet</span>
        ),
      },
      {
        label: "Tracked",
        href: "/dashboard/content?section=keywords",
        value: trackedCount,
        delta: "Keywords",
        spark: [1, 2, 3, trackedCount, trackedCount],
        color: "#10b981",
        theme: "emerald",
        info: (
          <span className="line-clamp-2 leading-relaxed text-slate-600">
            Target: <strong className="text-emerald-600 font-semibold">&quot;{firstTrackedQuery}&quot;</strong>
          </span>
        ),
      },
      {
        label: "Gaps",
        href: "/dashboard/geo-audit#priority-fixes",
        value: gapsCount,
        delta: "Needs fix",
        spark: [5, 4, 3, 2, gapsCount],
        color: "#f43f5e",
        theme: "rose",
        info: (
          <span className="line-clamp-2 leading-relaxed text-slate-600">
            Fix: <strong className="text-rose-600 font-semibold">{gapsList[0]}</strong>
          </span>
        ),
      },
    ];
  }, [
    citedPromptsCount,
    trackedCount,
    citedCount,
    gapsCount,
    citedPromptsList,
    citedPlatformNames,
    firstTrackedQuery,
    gapsList,
  ]);

  const topPrompts = filteredPromptRowsAll.slice(0, 5);
  const filteredPromptRows = useMemo(() => {
    const rows = topPrompts.length
      ? topPrompts
      : [{ prompt: workspace.buyerQuestion, cited: false, leader: "—" } as PromptRow];
    if (promptFilter === "cited") return rows.filter((row) => row.cited);
    if (promptFilter === "gaps") return rows.filter((row) => !row.cited);
    return rows;
  }, [topPrompts, promptFilter, workspace.buyerQuestion]);
  const moneyPromptList = (
    topPrompts.length
      ? topPrompts
      : [{ prompt: workspace.buyerQuestion, cited: false }]
  ).slice(0, 5);

  return (
    <div className="space-y-5 pb-8">
      {showAgencyBackLink && (
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:text-accent-deep"
        >
          ← Agency overview
        </Link>
      )}
      <DashboardOverviewLead workspace={workspace} />

      {!workspace.hasRealAudit ? (
        <>
          <DashboardWorkspaceEmpty workspace={workspace} />
          <div
            data-tour="results"
            className="rounded-2xl border border-dashed border-border bg-surface/80 px-6 py-8 text-center"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              Citation results
            </p>
            <p className="mt-2 text-sm text-muted">
              Your citation score, platform heatmap, and weekly action plan will
              appear here after your first scan.
            </p>
          </div>
          <GettingStartedChecklist workspace={workspace} />
        </>
      ) : (
        <>
      <GettingStartedChecklist workspace={workspace} />

      <WeeklyMonitoringPanel workspace={workspace} />

      <DashboardFilterBar
        actions={
          <Link
            href="/dashboard/geo-audit"
            className="rounded-lg bg-accent px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-accent-deep"
          >
            Run new scan
          </Link>
        }
      >
        <DashboardFilterSelect
          label="Site"
          value={workspace.domain}
          options={[{ value: workspace.domain, label: workspace.domain }]}
        />
        <DashboardFilterSelect
          label="Period"
          value={periodFilter}
          options={DASHBOARD_PERIOD_OPTIONS}
          onChange={(value) => setPeriodFilter(value as DashboardPeriod)}
        />
        <DashboardFilterSelect
          label="Platforms"
          value={platformFilter}
          options={DASHBOARD_PLATFORM_OPTIONS}
          onChange={(value) => setPlatformFilter(value as DashboardPlatformFilter)}
        />
      </DashboardFilterBar>

      <CopilotDashboardPrompt />
      <DashboardWidgetGrid workspace={workspace} />

      {/* Position Tracking */}
      <DashboardCard
        title="Citation position tracking"
        action={periodDisplayLabel(periodFilter)}
        dataStatus={auditDataStatus}
        className="overflow-hidden"
      >
        {/* Top row: gauge + 4 stat tiles */}
        <div className="grid gap-5 sm:grid-cols-[auto_1fr]">
          {/* Gauge */}
          <div className="flex flex-col items-center justify-center rounded-2xl bg-surface p-5 sm:min-w-[180px]">
            <DashboardGaugeChart
              value={workspace.citationScore}
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
            {keywordBuckets.map((b) => (
              <DashboardMetricTile
                key={b.label}
                label={b.label}
                value={formatCompact(b.value)}
                delta={b.delta}
                href={b.href}
                theme={b.theme as "sky" | "violet" | "emerald" | "rose"}
                spark={b.spark}
                sparkColor={b.color}
                footer={b.info}
              />
            ))}
          </div>
        </div>

        {/* Prompt table with filters */}
        <div className="mt-5 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <DashboardFilterTabs
              items={[
                { id: "all", label: "All prompts", count: topPrompts.length || 1 },
                { id: "cited", label: "Cited", count: citedPromptsCount },
                { id: "gaps", label: "Gaps", count: Math.max(0, (topPrompts.length || 1) - citedPromptsCount) },
              ]}
              value={promptFilter}
              onChange={setPromptFilter}
            />
            <Link
              href="/dashboard/content?section=keywords"
              className="text-xs font-semibold text-accent hover:text-accent-deep"
            >
              Manage prompts →
            </Link>
          </div>

          <DashboardTable minWidth="420px">
            <DashboardTableHead>
              <DashboardTableRow header>
                <DashboardTableTh>Money prompt</DashboardTableTh>
                <DashboardTableTh>4-wk trend</DashboardTableTh>
                <DashboardTableTh>Status</DashboardTableTh>
                <DashboardTableTh>vs competitor</DashboardTableTh>
                <DashboardTableTh>Leader</DashboardTableTh>
              </DashboardTableRow>
            </DashboardTableHead>
            <DashboardTableBody>
              {filteredPromptRows.map((row) => {
                const promptRow = row as PromptRow;
                const vs = competitorForPrompt(workspace, promptRow);
                const trend = promptCitationTrend(workspace, promptRow);
                return (
                  <DashboardTableRow key={row.prompt}>
                    <DashboardTableTd className="max-w-[240px] font-medium text-ink">
                      {row.prompt.length > 52 ? `${row.prompt.slice(0, 52)}…` : row.prompt}
                    </DashboardTableTd>
                    <DashboardTableTd>
                      <PromptSparkline values={trend} positive={Boolean(row.cited)} />
                    </DashboardTableTd>
                    <DashboardTableTd>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${
                          row.cited
                            ? "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-300"
                            : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            row.cited ? "bg-accent" : "bg-amber-400"
                          }`}
                          aria-hidden
                        />
                        {row.cited ? "Cited" : "Gap"}
                      </span>
                    </DashboardTableTd>
                    <DashboardTableTd>
                      <span
                        className={`text-[11px] font-semibold ${
                          vs.clientAhead ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {vs.clientAhead ? "You" : vs.name}
                      </span>
                    </DashboardTableTd>
                    <DashboardTableTd className="max-w-[180px] truncate text-muted">
                      {row.leader ?? "—"}
                    </DashboardTableTd>
                  </DashboardTableRow>
                );
              })}
            </DashboardTableBody>
          </DashboardTable>
        </div>
      </DashboardCard>

      {/* Row 2 */}
      <div className="grid gap-5 lg:grid-cols-2">
        <DashboardCard title="Platform overview" dataStatus={auditDataStatus}>
          <div className="flex flex-wrap items-center justify-around gap-4 border-b border-border pb-5">
            <DashboardRingChart
              value={workspace.domainRating || workspace.citationScore}
              label="DR"
            />
            <DashboardRingChart
              value={workspace.visibilityScore || citedCount * 12}
              label="Visibility"
            />
            <DashboardRingChart
              value={Math.round((citedCount / platformDenominator) * 100)}
              label="Coverage"
            />
          </div>

          {/* Rosen-style horizontal bar chart — LLM platform citation coverage */}
          <div className="mt-5">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">AI Engine Coverage</p>
            <RosenHorizontalBarChart
              data={filteredPlatformRows.map((p) => ({
                label: p.name,
                // Use real share if available; otherwise derive a stable value from citation status
                value: p.share != null ? p.share : p.cited ? 65 : 12,
                color: p.cited ? "#6366f1" : "#cbd5e1",
              }))}
              maxValue={100}
              formatValue={(v) => `${v}%`}
              height={Math.max(1, filteredPlatformRows.length) * 30}
            />
          </div>
        </DashboardCard>

        <DashboardCard
          title="Sessions & engagement"
          action="View full report"
          actionHref="/dashboard/analytics"
          dataStatus={auditDataStatus}
        >
          <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
            {[
              { label: "Platforms cited", value: `${citedCount}/${platformDenominator}` },
              { label: "Prompts tracked", value: String(workspace.promptsTracked) },
              { label: "Content drafts", value: String(workspace.contentDrafts) },
              { label: "Backlink sources", value: String(workspace.sourceCount) },
              { label: "Community", value: String(workspace.communityMentions) },
              { label: "Weekly lift", value: workspace.weeklyLiftAvailable ? workspace.weeklyLift : "—" },
            ].map((m) => (
              <div key={m.label} className="group">
                <p className="text-[11px] font-medium uppercase tracking-wide text-[#94a3b8]">{m.label}</p>
                <p className="mt-0.5 font-display text-xl font-bold tracking-tight text-[#0f172a]">{m.value}</p>
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
                {(workspace.visibilityScore || workspace.citationScore * 0.4).toFixed(1)}%
                <span className="ml-1 text-sm font-medium text-accent">
                  {workspace.weeklyLiftAvailable ? workspace.weeklyLift : "—"}
                </span>
              </p>
              <p className="mt-1 text-xs text-muted">AI answer share</p>
            </div>
            <span className="rounded-full bg-accent/10 px-2 py-1 text-[11px] font-semibold text-accent-deep">
              Rank ↑ {Math.max(1, 30 - workspace.citationScore / 3)}
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
          title="Priority GEO gaps"
          action="GEO Audit"
          actionHref="/dashboard/geo-audit"
          dataStatus={workspace.gaps.length > 0 ? auditDataStatus : "demo"}
        >
          <ul className="space-y-3 text-xs text-slate-600">
            {gapsList.slice(0, 4).map((gap, idx) => (
              <li key={idx} className="flex items-start justify-between gap-3 group/item">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-50 text-[10px] font-bold text-rose-600 border border-rose-100">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed text-slate-700">{gap}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenFix(gap)}
                  className="shrink-0 flex items-center gap-1 px-2.5 py-1 text-[9px] font-bold text-rose-600 bg-rose-50 border border-rose-100/50 rounded-lg hover:bg-rose-100/70 hover:border-rose-200 transition duration-150 cursor-pointer opacity-70 group-hover/item:opacity-100"
                >
                  {getFixActionLabel(gap, workspace.domain)} ✦
                </button>
              </li>
            ))}
          </ul>
        </DashboardCard>
      </div>

      {/* Row 6 */}
      <div className="grid gap-5 xl:grid-cols-[2fr_1fr]">
        <CitationTrendPanel
          historyLabels={historyLabels}
          historyValues={historyValues}
          citedCount={citedCount}
          platformCount={PLATFORMS.length}
          trendDataStatus={trendDataStatus}
        />

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
            <div className="flex flex-col h-full justify-between">
              {/* Summary Stats Row */}
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Score</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-3xl font-extrabold tracking-tight text-ink">{workspace.citationScore}%</span>
                    <CiteStatusBadge score={workspace.citationScore} size="sm" />
                    {workspace.weeklyLiftAvailable && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
                        {workspace.weeklyLift}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">LLM Coverage</p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                      {citedCount}<span className="text-slate-300 font-normal text-xl">/{PLATFORMS.length}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium ml-1">citing</span>
                  </div>
                </div>
              </div>

              {/* Platform breakdown list */}
              <div className="mt-4 space-y-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Live Status by Engine</p>
                <div className="grid grid-cols-2 gap-2">
                  {platformRows.map((p) => (
                    <div 
                      key={p.name} 
                      className={`flex items-center justify-between rounded-xl border p-2.5 text-xs transition-all duration-150 ${
                        p.cited 
                          ? "border-emerald-100 bg-gradient-to-r from-emerald-50/50 to-card text-ink shadow-[0_1px_2px_rgba(16,185,129,0.02)] dark:border-emerald-900/40 dark:from-emerald-950/30 dark:to-[#111]"
                          : "border-border bg-gradient-to-r from-surface/50 to-card text-muted dark:from-[#161616] dark:to-[#111]"
                      }`}
                    >
                      <span className="font-semibold truncate max-w-[100px]">{p.name}</span>
                      <div className="flex items-center gap-1.5">
                        <PlatformScanBadge platformName={p.name} plan={userPlan} compact />
                        <span className={`h-1.5 w-1.5 rounded-full ${p.cited ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${p.cited ? "text-emerald-600" : "text-slate-400"}`}>
                          {p.cited ? "Cited" : "Gap"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <CiteStatusMilestones workspace={workspace} compact />
            </div>
          </DashboardCard>
        </div>
      </div>

        </>
      )}

      <QuickFixModal
        isOpen={isFixOpen}
        onClose={() => setIsFixOpen(false)}
        gap={selectedGap}
        workspace={workspace}
      />
    </div>
  );
}
