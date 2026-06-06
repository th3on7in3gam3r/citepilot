"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CopilotInsight } from "@/components/dashboard/CopilotInsight";
import { ScanDeltaCard } from "@/components/dashboard/ScanDeltaCard";
import { emptyScanDeltaSummary } from "@/lib/audit/scan-delta";
import { ExecutiveBriefingPanel } from "@/components/dashboard/ExecutiveBriefingPanel";
import { GettingStartedChecklist } from "@/components/dashboard/GettingStartedChecklist";
import { CitationVolumeChart } from "@/components/dashboard/CitationVolumeChart";
import {
  DashboardPageHeader,
  Panel,
  StatCard,
} from "@/components/dashboard/DashboardUI";
import { getStoredWorkspaceId } from "@/lib/client/api";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { PLATFORMS } from "@/lib/dashboard";
import {
  buildDashboardAlerts,
  buildMoneyPromptIdeas,
  platformRowsFromWorkspace,
  type DashboardAlertItem,
  type MoneyPromptIdea,
} from "@/lib/dashboard-data";

const promptIntentTone: Record<MoneyPromptIdea["intent"], string> = {
  comparison: "bg-sky-50 text-sky-800",
  alternatives: "bg-violet-50 text-violet-800",
  pricing: "bg-emerald-50 text-emerald-800",
  roi: "bg-amber-50 text-amber-800",
  "buyer-fit": "bg-orange-50 text-orange-800",
  implementation: "bg-surface text-muted",
};

const alertToneStyles: Record<
  DashboardAlertItem["tone"],
  { badge: string; card: string; label: string }
> = {
  critical: {
    badge: "bg-red-50 text-red-700",
    card: "border-red-200 bg-red-50/60",
    label: "Critical",
  },
  opportunity: {
    badge: "bg-amber-50 text-amber-800",
    card: "border-amber-200 bg-amber-50/60",
    label: "Opportunity",
  },
  info: {
    badge: "bg-sky-50 text-sky-800",
    card: "border-sky-200 bg-sky-50/60",
    label: "Info",
  },
  positive: {
    badge: "bg-emerald-50 text-emerald-700",
    card: "border-emerald-200 bg-emerald-50/60",
    label: "Ready",
  },
};

export function DashboardOverview() {
  const { workspace, ready, refresh } = useWorkspaceContext();
  const searchParams = useSearchParams();
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("welcome") !== "1") return;
    const first = setTimeout(() => refresh(), 4000);
    const second = setTimeout(() => refresh(), 10000);
    return () => {
      clearTimeout(first);
      clearTimeout(second);
    };
  }, [searchParams, refresh]);

  if (!ready || !workspace) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-10 w-48 rounded-lg bg-surface" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-surface" />
          ))}
        </div>
      </div>
    );
  }

  const platformRows = platformRowsFromWorkspace(workspace, PLATFORMS);
  const seed = workspace.domain.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const moneyPrompts = buildMoneyPromptIdeas(workspace);
  const alerts = buildDashboardAlerts(workspace);
  const gaps =
    workspace.gaps.length > 0
      ? workspace.gaps.slice(0, 3)
      : [
          `Add answer capsule for "${workspace.buyerQuestion}"`,
          "Publish comparison page vs top competitor",
          "Engage buyer threads on Hacker News or Stack Overflow",
        ];

  const showWelcome = searchParams.get("welcome") === "1";
  const workspaceId =
    workspace.workspaceId ?? workspace.id ?? getStoredWorkspaceId() ?? undefined;

  async function copyPrompt(prompt: string) {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedPrompt(prompt);
      window.setTimeout(() => setCopiedPrompt((current) => (current === prompt ? null : current)), 1800);
    } catch {
      setCopiedPrompt(null);
    }
  }

  return (
    <>
      <GettingStartedChecklist workspace={workspace} welcome={showWelcome} />

      <DashboardPageHeader
        headingLevel="h2"
        title="Citation overview"
        description={
          workspace.hasRealAudit
            ? `Citation health for ${workspace.domain}. Scores from your latest GEO audit (${workspace.auditMode ?? "technical"}).`
            : `Citation health for ${workspace.domain}. Run an audit to populate live scores.`
        }
        action={
          <Link
            href="/audit"
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#7b93f0] via-[#6b8cff] to-accent px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(107,140,255,0.3)]"
          >
            Run citation audit
          </Link>
        }
      />

      <ExecutiveBriefingPanel workspace={workspace} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Citation score"
          value={String(workspace.citationScore)}
          sub="/100"
          trend={
            workspace.weeklyLiftAvailable
              ? `${workspace.weeklyLift} since prior audit`
              : workspace.hasRealAudit
                ? "Run another audit for trend"
                : undefined
          }
        />
        <StatCard
          label="Platforms cited"
          value={`${workspace.citedPlatforms}`}
          sub={`/${workspace.totalPlatforms}`}
        />
        <StatCard
          label="Prompts tracked"
          value={String(workspace.promptsTracked)}
        />
        <StatCard
          label="Community signals"
          value={
            workspace.communityMentions > 0
              ? String(workspace.communityMentions)
              : "—"
          }
          sub={
            workspace.communityMentions > 0 ? "mentions" : "Check Discussions tab"
          }
        />
      </div>

      <div className="mt-6">
        <ScanDeltaCard
          domain={workspace.domain}
          scanDelta={workspace.scanDelta ?? emptyScanDeltaSummary}
        />
      </div>

      <div className="mt-6">
        <CitationVolumeChart
          seed={seed}
          compact
          citationScore={workspace.citationScore}
          hasRealAudit={workspace.hasRealAudit}
          citationHistory={workspace.citationHistory}
        />
      </div>

      <Panel title="Alert center" className="mt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="max-w-3xl text-sm leading-relaxed text-muted">
              Prioritized in-app alerts for competitor movement, platform coverage,
              audit freshness, and stakeholder reporting. This is the premium command
              center layer on top of your scores.
            </p>
          </div>
          <Link
            href="/dashboard/settings"
            className="rounded-full border border-border bg-white px-4 py-2 text-xs font-semibold text-ink transition hover:bg-surface"
          >
            Manage alert settings
          </Link>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {alerts.map((alert) => {
            const tone = alertToneStyles[alert.tone];
            return (
              <div
                key={alert.id}
                className={`rounded-xl border px-5 py-4 ${tone.card}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${tone.badge}`}
                  >
                    {tone.label}
                  </span>
                  <Link
                    href={alert.href}
                    className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-surface"
                  >
                    {alert.cta}
                  </Link>
                </div>
                <p className="mt-3 font-medium text-ink">{alert.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">{alert.body}</p>
              </div>
            );
          })}
        </div>
      </Panel>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Platform presence">
          <ul className="space-y-2">
            {platformRows.map((p) => (
              <li
                key={p.name}
                className="flex items-center justify-between rounded-xl bg-surface px-4 py-3 text-sm"
              >
                <span className="font-medium text-ink">{p.name}</span>
                <span
                  className={p.cited ? "font-semibold text-mint" : "text-muted"}
                >
                  {p.cited
                    ? "share" in p && p.share
                      ? `${p.share}% cited`
                      : "Cited"
                    : "Missing"}
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="This week's actions">
          {workspaceId && (
            <CopilotInsight
              kind="prioritize"
              workspaceId={workspaceId}
              requiresAudit={!workspace.hasRealAudit}
            />
          )}
          <ol className="mt-4 space-y-3 text-sm text-muted">
            {gaps.map((g, i) => (
              <li key={g} className="flex gap-3">
                <span className="font-bold text-accent">{i + 1}</span>
                {g}
              </li>
            ))}
          </ol>
        </Panel>
      </div>

      <Panel title="Money prompt suggestions" className="mt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="max-w-3xl text-sm leading-relaxed text-muted">
              Buyer-intent prompt ideas generated from your domain, niche, saved buyer
              question, and competitor set. Use these in audits, content briefs, and
              discussion research.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/content"
              className="rounded-full border border-border bg-white px-4 py-2 text-xs font-semibold text-ink transition hover:bg-surface"
            >
              Turn into content
            </Link>
            <Link
              href="/dashboard/discussions"
              className="rounded-full border border-border bg-white px-4 py-2 text-xs font-semibold text-ink transition hover:bg-surface"
            >
              Research in Discussions
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {moneyPrompts.map((item) => (
            <div
              key={item.prompt}
              className="rounded-xl border border-border bg-surface px-5 py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${promptIntentTone[item.intent]}`}
                >
                  {item.intent.replace("-", " ")}
                </span>
                <button
                  type="button"
                  onClick={() => void copyPrompt(item.prompt)}
                  className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-surface"
                >
                  {copiedPrompt === item.prompt ? "Copied!" : "Copy prompt"}
                </button>
              </div>
              <p className="mt-3 font-medium text-ink">{item.prompt}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.reason}</p>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
