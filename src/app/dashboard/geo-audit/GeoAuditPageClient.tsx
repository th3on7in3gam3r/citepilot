"use client";

import { useState } from "react";
import Link from "next/link";
import { DashboardPageHeader, Panel, StatCard } from "@/components/dashboard/DashboardUI";
import { CopilotInsight } from "@/components/dashboard/CopilotInsight";
import { ShareAuditPanel } from "@/components/dashboard/ShareAuditPanel";
import { ShareAuditResultsCard } from "@/components/dashboard/ShareAuditResultsCard";
import { AuditFeedbackSurvey } from "@/components/feedback/AuditFeedbackSurvey";
import { QuickFixModal } from "@/components/dashboard/QuickFixModal";
import { getStoredWorkspaceId, runAudit } from "@/lib/client/api";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { productFeatures } from "@/lib/features";
import { promptsFromPreferences } from "@/lib/audit/resolve-prompts";
import { useToast } from "@/components/notifications/ToastProvider";
import { trackAuditCompleted, trackEvent } from "@/lib/analytics/track";
import { PROMPT_LIMIT_FREE } from "@/lib/billing/limits";

const feature = productFeatures.find((f) => f.id === "geo-audit")!;

const fallbackGaps = [
  "Missing FAQPage schema on key landing pages",
  "No concise answer capsule (40–60 words) above the fold",
  "Weak entity signals on review and community sites",
  "Competitor cited on more platforms for your top prompt",
];

export function GeoAuditPageClient() {
  const { workspace, ready, refresh } = useWorkspaceContext();
  const toast = useToast();
  const [auditing, setAuditing] = useState(false);
  const [showShareBanner, setShowShareBanner] = useState(false);
  const [lastAuditId, setLastAuditId] = useState<string | null>(null);
  const [lastAuditScore, setLastAuditScore] = useState<number | null>(null);
  const [promptLimitMax, setPromptLimitMax] = useState<number | null>(PROMPT_LIMIT_FREE);

  const [selectedGap, setSelectedGap] = useState<string | null>(null);
  const [isFixOpen, setIsFixOpen] = useState(false);

  function handleOpenFix(gapText: string) {
    setSelectedGap(gapText);
    setIsFixOpen(true);
  }

  if (!ready || !workspace) return null;

  const gaps = workspace.gaps.length > 0 ? workspace.gaps : fallbackGaps;
  const geoScore = workspace.siteSignals?.geoScore ?? workspace.citationScore;
  const workspaceId =
    workspace.workspaceId ?? workspace.id ?? getStoredWorkspaceId() ?? undefined;

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
        const d = (await r.json()) as { prompts?: { max: number | null } };
        limit = d?.prompts?.max ?? PROMPT_LIMIT_FREE;
        setPromptLimitMax(limit);
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
    toast.info("Running GEO audit…", { description: "This may take up to a minute." });

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
          <Link
            href="/audit"
            className="text-sm font-semibold text-accent hover:text-accent-deep"
          >
            Open full audit tool →
          </Link>
        }
      />

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
          <div className="mt-4">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
              <div className="h-full animate-pulse rounded-full bg-accent" style={{ width: "60%" }} />
            </div>
            <p className="mt-2 text-xs text-muted">Scanning AI surfaces — this takes about 30–60 seconds…</p>
          </div>
        )}
      </Panel>

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
        <StatCard label="GEO score" value={String(geoScore)} sub="/100" />
        <StatCard
          label="Platforms"
          value={`${workspace.citedPlatforms}/${workspace.totalPlatforms}`}
        />
        <StatCard label="Gaps found" value={String(gaps.length)} />
      </div>
      {workspace.siteSignals && (
        <Panel title="Site signals" className="mt-6">
          <ul className="grid gap-2 text-sm sm:grid-cols-2">
            <li className="rounded-xl bg-surface px-4 py-3">
              Title: {workspace.siteSignals.title ?? "Missing"}
            </li>
            <li className="rounded-xl bg-surface px-4 py-3">
              Meta description: {workspace.siteSignals.metaDescription ? "Present" : "Missing"}
            </li>
            <li className="rounded-xl bg-surface px-4 py-3">
              JSON-LD: {workspace.siteSignals.hasJsonLd ? "Yes" : "No"}
            </li>
            <li className="rounded-xl bg-surface px-4 py-3">
              FAQ schema: {workspace.siteSignals.hasFaqSchema ? "Yes" : "No"}
            </li>
            <li className="rounded-xl bg-surface px-4 py-3">
              Sitemap: {workspace.siteSignals.sitemapFound ? "Found" : "Not found"}
            </li>
            <li className="rounded-xl bg-surface px-4 py-3">
              Word count: {workspace.siteSignals.wordCount}
            </li>
          </ul>
        </Panel>
      )}
      <Panel title="Priority fixes" className="mt-6" id="priority-fixes">
        <p className="mb-4 text-sm text-muted">
          From your latest audit. Use CitePilot Insights for a plain-language
          explanation of any gap (Pilot+, or one free preview on Free) or click Quick Fix to copy pre-generated code snippets.
        </p>
        <ul className="space-y-3 text-sm text-muted">
          {gaps.map((g) => (
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
                  Quick Fix ✦
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
          ))}
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
