"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DashboardWidgetGrid } from "@/components/dashboard/copilot/DashboardWidgetGrid";
import { QuickFixModal } from "@/components/dashboard/QuickFixModal";
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
import { RosenLineChart } from "@/components/charts/RosenLineChart";
import { RosenHorizontalBarChart } from "@/components/charts/RosenBarChart";
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

  const [selectedGap, setSelectedGap] = useState<string | null>(null);
  const [isFixOpen, setIsFixOpen] = useState(false);

  function handleOpenFix(gapText: string) {
    setSelectedGap(gapText);
    setIsFixOpen(true);
  }

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

  const citedPromptsCount = promptRows.filter((r) => r.cited).length;
  const trackedCount = activeWorkspace.promptsTracked;
  const gapsCount = activeWorkspace.gaps.length || 3;

  const citedPlatformNames = useMemo(
    () => platformRows.filter((p) => p.cited).map((p) => p.name),
    [platformRows]
  );

  const citedPromptsList = useMemo(
    () => promptRows.filter((p) => p.cited).map((p) => p.prompt),
    [promptRows]
  );

  const firstTrackedQuery = activeWorkspace.buyerQuestion || "best tool for saas";

  const gapsList = useMemo(
    () =>
      activeWorkspace.gaps.length > 0
        ? activeWorkspace.gaps
        : [
            "Missing FAQPage schema — high-impact for AI answer extraction",
            "No Organization schema — weakens brand entity recognition",
            "Thin homepage content (<300 words) — add an answer capsule above the fold",
          ],
    [activeWorkspace.gaps]
  );

  const keywordBuckets = useMemo(() => {
    return [
      {
        label: "Cited",
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

  const topPrompts = promptRows.slice(0, 5);
  const moneyPromptList = (
    topPrompts.length
      ? topPrompts
      : [{ prompt: activeWorkspace.buyerQuestion, cited: false }]
  ).slice(0, 5);

  if (!ready) {
    return <DashboardPageSkeleton />;
  }

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
              const isRose = b.theme === "rose";
              const isSky = b.theme === "sky";
              const isViolet = b.theme === "violet";
              const isEmerald = b.theme === "emerald";
              
              const borderClass = isSky 
                ? "border-sky-100 hover:border-sky-200" 
                : isViolet 
                ? "border-violet-100 hover:border-violet-200" 
                : isEmerald 
                ? "border-emerald-100 hover:border-emerald-200" 
                : "border-rose-100 hover:border-rose-200";

              const bgClass = isSky 
                ? "bg-gradient-to-br from-sky-50/40 via-white to-white" 
                : isViolet 
                ? "bg-gradient-to-br from-violet-50/40 via-white to-white" 
                : isEmerald 
                ? "bg-gradient-to-br from-emerald-50/40 via-white to-white" 
                : "bg-gradient-to-br from-rose-50/40 via-white to-white";

              const textClass = isRose ? "text-rose-700" : "text-slate-900";
              const accentBar = isSky 
                ? "bg-gradient-to-r from-sky-400 to-blue-500" 
                : isViolet 
                ? "bg-gradient-to-r from-violet-400 to-indigo-500" 
                : isEmerald 
                ? "bg-gradient-to-r from-emerald-400 to-teal-500" 
                : "bg-gradient-to-r from-rose-400 to-pink-500";

              const badgeBg = isSky 
                ? "bg-sky-50 border-sky-100 text-sky-700" 
                : isViolet 
                ? "bg-violet-50 border-violet-100 text-violet-700" 
                : isEmerald 
                ? "bg-emerald-50 border-emerald-100 text-emerald-700" 
                : "bg-rose-50 border-rose-100 text-rose-700";

              return (
                <div
                  key={b.label}
                  className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-5 shadow-[0_2px_8px_rgba(15,23,42,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(15,23,42,0.06)] ${borderClass} ${bgClass}`}
                >
                  {/* Top accent sliver */}
                  <div
                    className={`absolute inset-x-0 top-0 h-[3px] transition-all duration-200 ${accentBar}`}
                    aria-hidden
                  />
                  
                  {/* Card Header (Label + Icon) */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                      {b.label}
                    </span>
                    <div className={`flex items-center justify-center p-1.5 rounded-lg border transition-transform duration-200 group-hover:scale-110 ${badgeBg}`}>
                      {b.theme === "sky" && (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      )}
                      {b.theme === "violet" && (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                      )}
                      {b.theme === "emerald" && (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                      {b.theme === "rose" && (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Card Body (Value + Trend badge) */}
                  <div className="mt-4 flex items-baseline justify-between">
                    <span className={`font-display text-[28px] font-extrabold tracking-tight leading-none ${textClass}`}>
                      {formatCompact(b.value)}
                    </span>
                    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold shadow-[0_1px_2px_rgba(0,0,0,0.02)] ${badgeBg}`}>
                      {b.delta}
                    </span>
                  </div>

                  {/* Card Info/Details */}
                  <div className="mt-3 flex items-center min-h-[36px] border-t border-slate-100/40 pt-2 text-[10px]">
                    {b.info}
                  </div>

                  {/* Card Footer (Sparkline) */}
                  <div className="mt-4 pt-3 border-t border-slate-100/50">
                    <DashboardSparkline
                      values={b.spark}
                      color={b.color}
                      className="h-7 w-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom row: prompt table */}
        <div className="mt-5 overflow-x-auto rounded-2xl border border-[#eef2f6] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
          <table className="w-full min-w-[420px] text-left text-xs">
            <thead>
              <tr className="border-b border-[#eef2f6] bg-[#f8fafc]">
                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]">Money prompt</th>
                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]">Status</th>
                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]">Leader</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {(topPrompts.length
                ? topPrompts
                : [{ prompt: activeWorkspace.buyerQuestion, cited: false, leader: "—" }]
              ).map((row) => (
                <tr key={row.prompt} className="bg-white transition-colors duration-100 hover:bg-[#fafbfd]">
                  <td className="px-4 py-3 pr-2 font-medium text-[#0f172a]">
                    {row.prompt.length > 52 ? `${row.prompt.slice(0, 52)}…` : row.prompt}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${
                        row.cited
                          ? "border-[#bae6fd] bg-[#e0f2fe] text-[#0284c7]"
                          : "border-amber-200 bg-amber-50 text-amber-700"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          row.cited ? "bg-[#0ea5e9]" : "bg-amber-400"
                        }`}
                        aria-hidden
                      />
                      {row.cited ? "Cited" : "Gap"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#64748b]">
                    <span className="max-w-[180px] truncate block">{row.leader ?? "—"}</span>
                  </td>
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

          {/* Rosen-style horizontal bar chart — LLM platform citation coverage */}
          <div className="mt-5">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">AI Engine Coverage</p>
            <RosenHorizontalBarChart
              data={platformRows.map((p) => ({
                label: p.name,
                // Use real share if available; otherwise derive a stable value from citation status
                value: p.share != null ? p.share : p.cited ? 65 : 12,
                color: p.cited ? "#6366f1" : "#cbd5e1",
              }))}
              maxValue={100}
              formatValue={(v) => `${v}%`}
              height={platformRows.length * 30}
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
              { label: "Platforms cited", value: `${citedCount}/${PLATFORMS.length}` },
              { label: "Prompts tracked", value: String(activeWorkspace.promptsTracked) },
              { label: "Content drafts", value: String(activeWorkspace.contentDrafts) },
              { label: "Backlink sources", value: String(activeWorkspace.sourceCount) },
              { label: "Community", value: String(activeWorkspace.communityMentions) },
              { label: "Weekly lift", value: activeWorkspace.weeklyLiftAvailable ? activeWorkspace.weeklyLift : "—" },
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
          dataStatus={activeWorkspace.gaps.length > 0 ? auditDataStatus : "demo"}
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
                  Quick Fix ✦
                </button>
              </li>
            ))}
          </ul>
        </DashboardCard>
      </div>

      {/* Row 6 */}
      <div className="grid gap-5 xl:grid-cols-[2fr_1fr]">
        <DashboardCard title="Citation trend" action="Last 30 days" dataStatus={trendDataStatus}>
          <div className="space-y-6">
            {/* Rosen-style gradient line chart — Citation Score */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Citation Score</p>
                <span className="text-xs font-bold text-indigo-600">
                  {historyValues.length > 0 ? historyValues[historyValues.length - 1] : 0}
                </span>
              </div>
              <RosenLineChart
                labels={historyLabels}
                series={[
                  {
                    label: "Score",
                    values: historyValues,
                    gradientFrom: "#6366f1",
                    gradientTo: "#a78bfa",
                  },
                ]}
                height={108}
              />
            </div>

            {/* Rosen-style gradient line chart — Platforms Cited */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Platforms Cited</p>
                <span className="text-xs font-bold text-sky-600">
                  {citedCount}/{PLATFORMS.length}
                </span>
              </div>
              <RosenLineChart
                labels={historyLabels}
                series={[
                  {
                    label: "Platforms",
                    values: historyValues.map((v) => Math.round(v / 15)),
                    gradientFrom: "#0ea5e9",
                    gradientTo: "#38bdf8",
                  },
                ]}
                height={108}
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
            <div className="flex flex-col h-full justify-between">
              {/* Summary Stats Row */}
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Score</p>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{activeWorkspace.citationScore}%</span>
                    {activeWorkspace.weeklyLiftAvailable && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
                        {activeWorkspace.weeklyLift}
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
                          ? "border-emerald-100 bg-gradient-to-r from-emerald-50/50 to-white text-slate-900 shadow-[0_1px_2px_rgba(16,185,129,0.02)]" 
                          : "border-slate-100 bg-gradient-to-r from-slate-50/50 to-white text-slate-400"
                      }`}
                    >
                      <span className="font-semibold truncate max-w-[100px]">{p.name}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${p.cited ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${p.cited ? "text-emerald-600" : "text-slate-400"}`}>
                          {p.cited ? "Cited" : "Gap"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DashboardCard>
        </div>
      </div>

      <QuickFixModal
        isOpen={isFixOpen}
        onClose={() => setIsFixOpen(false)}
        gap={selectedGap}
        workspace={activeWorkspace}
      />
    </div>
  );
}
