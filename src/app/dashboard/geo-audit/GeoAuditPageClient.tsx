"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DashboardPageHeader, Panel, StatCard } from "@/components/dashboard/DashboardUI";
import {
  DashboardFilterBar,
  DashboardFilterSelect,
} from "@/components/dashboard/layout/DashboardToolbar";
import { CopilotInsight } from "@/components/dashboard/CopilotInsight";
import { ShareAuditPanel } from "@/components/dashboard/ShareAuditPanel";
import { ShareAuditResultsCard } from "@/components/dashboard/ShareAuditResultsCard";
import { AuditFeedbackSurvey } from "@/components/feedback/AuditFeedbackSurvey";
import { QuickFixModal } from "@/components/dashboard/QuickFixModal";
import { DashboardNoWorkspaceEmpty } from "@/components/dashboard/layout/DashboardNoWorkspaceEmpty";
import { getStoredWorkspaceId, runAudit } from "@/lib/client/api";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { productFeatures } from "@/lib/features";
import { promptsFromPreferences } from "@/lib/audit/resolve-prompts";
import { useToast } from "@/components/notifications/ToastProvider";
import { trackAuditCompleted, trackEvent } from "@/lib/analytics/track";
import { PROMPT_LIMIT_FREE } from "@/lib/billing/limits";
import { publicScorePageUrl } from "@/lib/score/public-score-url";
import { GeoAuditFixGuide } from "@/components/dashboard/geo-audit/GeoAuditFixGuide";
import { GeoAuditScanProgress } from "@/components/dashboard/geo-audit/GeoAuditScanProgress";
import { GeoAuditScanDelta } from "@/components/dashboard/geo-audit/GeoAuditScanDelta";
import { GeoAuditScoreBreakdown } from "@/components/dashboard/geo-audit/GeoAuditScoreBreakdown";
import { GeoAuditSiteSignals } from "@/components/dashboard/geo-audit/GeoAuditSiteSignals";
import { CiteStatusCard } from "@/components/dashboard/CiteStatusCard";
import { useCiteStatusCelebration } from "@/hooks/useCiteStatusCelebration";
import { emptyScanDeltaSummary } from "@/lib/audit/scan-delta";
import { getFixActionLabel } from "@/lib/geo/fixes";
import { PLATFORMS } from "@/lib/dashboard";
import {
  DASHBOARD_PERIOD_OPTIONS,
  DASHBOARD_PLATFORM_OPTIONS,
  filterPlatformRows,
  periodDisplayLabel,
  type DashboardPeriod,
  type DashboardPlatformFilter,
} from "@/lib/dashboard/overview-filters";
import { platformRowsFromWorkspace } from "@/lib/dashboard-data";

const feature = productFeatures.find((f) => f.id === "geo-audit")!;

export function GeoAuditPageClient() {
  const { workspace, ready, refresh } = useWorkspaceContext();
  const toast = useToast();
  const [auditing, setAuditing] = useState(false);
  const [showShareBanner, setShowShareBanner] = useState(false);
  const [lastAuditId, setLastAuditId] = useState<string | null>(null);
  const [lastAuditScore, setLastAuditScore] = useState<number | null>(null);
  const [promptLimitMax, setPromptLimitMax] = useState<number | null>(PROMPT_LIMIT_FREE);
  const [userPlan, setUserPlan] = useState<"free" | "pilot" | "fleet">("free");

  const [selectedGap, setSelectedGap] = useState<string | null>(null);
  const [isFixOpen, setIsFixOpen] = useState(false);
  const [periodFilter, setPeriodFilter] = useState<DashboardPeriod>("90d");
  const [platformFilter, setPlatformFilter] = useState<DashboardPlatformFilter>("all");

  function handleOpenFix(gapText: string) {
    setSelectedGap(gapText);
    setIsFixOpen(true);
  }

  const filteredPlatformRows = useMemo(() => {
    if (!workspace) return [];
    const rows = platformRowsFromWorkspace(workspace, PLATFORMS);
    return filterPlatformRows(rows, platformFilter);
  }, [workspace, platformFilter]);

  useCiteStatusCelebration(workspace);

  if (!ready) {
    return <div className="h-96 animate-pulse rounded-2xl bg-surface" />;
  }
  if (!workspace) {
    return (
      <DashboardNoWorkspaceEmpty description="Create a workspace to run GEO audits and see platform citation coverage." />
    );
  }

  const gaps = workspace.gaps;
  const scanDelta = workspace.scanDelta ?? emptyScanDeltaSummary;
  const promptsCited =
    workspace.promptResults?.filter((p) => p.cited).length ?? 0;
  const promptTotal = Math.max(
    workspace.promptResults?.length ?? workspace.promptsTracked,
    1,
  );
  const workspaceId =
    workspace.workspaceId ?? workspace.id ?? getStoredWorkspaceId() ?? undefined;

  const platformCitedCount = filteredPlatformRows.filter((row) => row.cited).length;
  const platformTotal = Math.max(1, filteredPlatformRows.length);

  async function handleRunAudit() {
    if (!workspaceId || !workspace) {
      toast.error("No workspace found. Complete onboarding first.");
      return;
    }
    // TypeScript narrowing — workspace is non-null from this point
    const ws = workspace;

    // Fetch prompt limit for this user's plan
    let limit = promptLimitMax;
    try {
      const r = await fetch("/api/billing/limits", { credentials: "include" });
      if (r.ok) {
        const d = (await r.json()) as {
          prompts?: { max: number | null; plan?: "free" | "pilot" | "fleet" };
        };
        limit = d?.prompts?.max ?? PROMPT_LIMIT_FREE;
        setPromptLimitMax(limit);
        if (d.prompts?.plan) setUserPlan(d.prompts.plan);
      }
    } catch {
      // use default
    }

    const prompts = promptsFromPreferences(
      ws.preferences ?? {},
      ws.buyerQuestion,
    );

    if (prompts.length === 0) {
      toast.error("Add at least one monitored prompt in Settings before running an audit.");
      return;
    }
    if (limit !== null && prompts.length > limit) {
      toast.error(
        `Your plan allows up to ${limit} prompts per audit. Reduce prompts in Settings or upgrade.`,
      );
      return;
    }

    setAuditing(true);
    toast.info("Running GEO audit…", {
      description: "Pilot scans can take up to 2 minutes with live browser checks.",
    });

    trackEvent("audit_started", { workspaceId, domain: ws.domain, source: "geo-audit" });

    try {
      const audit = await runAudit({ domain: ws.domain, prompts, workspaceId });
      trackAuditCompleted(workspaceId, { isSecond: ws.hasRealAudit, source: "geo-audit" });
      setLastAuditId(audit.id);
      setLastAuditScore(audit.score);
      await refresh();
      setShowShareBanner(true);
      toast.success("Audit complete — results updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Audit failed. Try again.");
    } finally {
      setAuditing(false);
    }
  }

  return (
    <>
      <DashboardPageHeader
        headingLevel="h2"
        title="GEO audit workspace"
        description={feature.description}
        action={
          <button
            type="button"
            onClick={() => void handleRunAudit()}
            disabled={auditing}
            className="inline-flex rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-deep disabled:opacity-50"
          >
            {auditing ? "Running…" : "Run GEO audit →"}
          </button>
        }
      />

      <DashboardFilterBar>
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

      {/* Run Audit Panel */}
      <Panel className="mb-6 border-l-4 border-l-accent">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-ink">
              {workspace.hasRealAudit ? "Re-run your GEO audit" : "Run your first GEO audit"}
            </p>
            <p className="mt-1 text-sm text-muted">
              {workspace.hasRealAudit
                ? `Last scored ${workspace.citationScore}/100 · Scanning ${workspace.domain} across ChatGPT, Perplexity, Gemini, and more.`
                : `Scan ${workspace.domain} across AI surfaces and get your citation score, platform presence, and priority fixes.`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleRunAudit()}
            disabled={auditing}
            className="shrink-0 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-deep disabled:opacity-60"
          >
            {auditing ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Running audit…
              </span>
            ) : workspace.hasRealAudit ? "Re-run audit" : "Run audit"}
          </button>
        </div>
        {auditing && (
          <GeoAuditScanProgress includesBrowserScans={userPlan !== "free"} />
        )}
      </Panel>

      {workspace.hasRealAudit && <CiteStatusCard workspace={workspace} />}

      {workspace.hasRealAudit && (
        <Panel className="mb-6 border border-border bg-surface/50">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-ink">Public score page</p>
              <p className="mt-1 text-sm text-muted">
                Shareable SEO landing page for {workspace.domain}. Claim it to control
                visibility in search.
              </p>
            </div>
            <Link
              href={publicScorePageUrl(workspace.domain)}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-full border border-accent/30 bg-white px-5 py-2.5 text-sm font-semibold text-accent transition hover:bg-accent/5"
            >
              View public score page →
            </Link>
          </div>
        </Panel>
      )}

      <ShareAuditResultsCard
        visible={showShareBanner}
        onDismiss={() => setShowShareBanner(false)}
      />

      {showShareBanner && (
        <div className="mb-6">
          <AuditFeedbackSurvey
            auditId={lastAuditId}
            workspaceId={workspaceId}
            domain={workspace.domain}
            score={lastAuditScore}
            source="dashboard"
          />
        </div>
      )}

      <div id="platform-coverage" className="scroll-mt-24 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Citation score"
          value={workspace.hasRealAudit ? String(workspace.citationScore) : "—"}
          sub="/100"
        />
        <StatCard
          label="Prompts cited"
          value={
            workspace.hasRealAudit ? `${promptsCited}/${promptTotal}` : "—"
          }
          sub="AI mentions"
        />
        <StatCard
          label="Platform coverage"
          value={
            workspace.hasRealAudit
              ? `${platformCitedCount}/${platformTotal}`
              : "—"
          }
          sub={periodDisplayLabel(periodFilter)}
        />
      </div>

      {workspace.hasRealAudit && filteredPlatformRows.length > 0 && (
        <Panel title="Platform coverage" className="mt-6">
          <ul className="grid gap-2 sm:grid-cols-2">
            {filteredPlatformRows.map((platform) => (
              <li
                key={platform.name}
                className="flex items-center justify-between rounded-xl border border-border bg-surface/50 px-4 py-3 text-sm"
              >
                <span className="font-medium text-ink">{platform.name}</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    platform.cited
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-surface text-muted"
                  }`}
                >
                  {platform.cited ? "Cited" : "Not cited"}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {workspace.hasRealAudit && (
        <>
          <GeoAuditScoreBreakdown workspace={workspace} />
          <GeoAuditFixGuide workspace={workspace} />
          <GeoAuditScanDelta domain={workspace.domain} scanDelta={scanDelta} />
        </>
      )}

      {workspace.hasRealAudit && workspace.siteSignals && (
        <GeoAuditSiteSignals signals={workspace.siteSignals} />
      )}
      <Panel title="Priority fixes" className="mt-6" id="priority-fixes">
        <p className="mb-4 text-sm text-muted">
          {workspace.hasRealAudit
            ? (
              <>
                From your latest live crawl. Schema and meta tags use{" "}
                <strong className="font-semibold text-ink">Quick Fix</strong> (GEO Snippet or copy-paste).
                Prompt and content gaps open a <strong className="font-semibold text-ink">Content guide</strong>{" "}
                — those require publishing new copy on {workspace.domain}. Re-run the audit after deploying.{" "}
                <Link
                  href="/dashboard/optimizer"
                  className="font-semibold text-accent hover:underline"
                >
                  Generate all fixes →
                </Link>
              </>
            )
            : "Priority fixes appear after your first GEO audit — run the scan above to populate this list."}
        </p>
        <ul className="space-y-3 text-sm text-muted">
          {!workspace.hasRealAudit ? (
            <li className="rounded-xl border border-dashed border-border bg-surface px-4 py-6 text-center text-sm text-muted">
              <p>No audit yet — run a scan to see prioritized gaps.</p>
              <button
                type="button"
                onClick={() => void handleRunAudit()}
                disabled={auditing}
                className="mt-3 inline-flex rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent-deep disabled:opacity-50"
              >
                {auditing ? "Running…" : "Run GEO audit →"}
              </button>
            </li>
          ) : gaps.length === 0 ? (
            <li className="rounded-xl border border-dashed border-border bg-surface px-4 py-6 text-center text-sm text-muted">
              <p>No priority gaps from your latest audit.</p>
              <Link
                href="/dashboard/optimizer"
                className="mt-3 inline-flex text-sm font-semibold text-accent hover:underline"
              >
                Open Site Optimizer →
              </Link>
            </li>
          ) : (
            gaps.map((g) => (
            <li key={g} className="rounded-xl bg-surface px-4 py-3">
              <div className="flex items-start justify-between gap-3 group/item mb-1">
                <div className="flex gap-3">
                  <span className="text-accent mt-0.5 font-bold">•</span>
                  <span className="flex-1 text-ink font-medium">{g}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenFix(g)}
                  className="shrink-0 flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl hover:bg-rose-100 hover:border-rose-200 transition duration-150 cursor-pointer"
                >
                  {getFixActionLabel(g, workspace.domain)} ✦
                </button>
              </div>
              {workspaceId && (
                <CopilotInsight
                  kind="explain-gap"
                  workspaceId={workspaceId}
                  gap={g}
                  requiresAudit={!workspace.hasRealAudit}
                  freeTeaser={workspace.freeExplainGapTeaserAvailable}
                  onTeaserUsed={() => void refresh()}
                  compact
                />
              )}
            </li>
            ))
          )}
        </ul>
      </Panel>
      {workspace.competitors.length > 0 && (
        <Panel title="Competitors tracked" className="mt-6">
          <div className="flex flex-wrap gap-2">
            {workspace.competitors.map((c, i) => (
              <span
                key={`comp-${i}`}
                className="rounded-full border border-border bg-surface px-4 py-2 text-sm"
              >
                {c}
              </span>
            ))}
          </div>
        </Panel>
      )}
      <ShareAuditPanel />

      <QuickFixModal
        isOpen={isFixOpen}
        onClose={() => setIsFixOpen(false)}
        gap={selectedGap}
        workspace={workspace}
      />
    </>
  );
}
