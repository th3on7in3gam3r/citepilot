"use client";

import type { WorkspaceSnapshot } from "@/lib/dashboard";
import { auditScoreBreakdown } from "@/lib/audit/score-breakdown";
import { Panel } from "@/components/dashboard/DashboardUI";

export function GeoAuditScoreBreakdown({ workspace }: { workspace: WorkspaceSnapshot }) {
  if (!workspace.hasRealAudit) return null;

  const geoScore = workspace.siteSignals?.geoScore ?? workspace.citationScore;
  const cited = workspace.promptResults?.filter((p) => p.cited).length ?? 0;
  const total = Math.max(
    workspace.promptResults?.length ?? workspace.promptsTracked,
    1,
  );

  const breakdown = auditScoreBreakdown({
    geoScore,
    cited,
    total,
  });

  const citationLimited =
    breakdown.geoScore >= 70 && breakdown.citedPercent < 50;

  return (
    <Panel title="How your score is calculated" className="mt-6">
      <p className="text-sm text-muted">
        Each re-run fetches your <strong className="text-ink">live homepage</strong> and
        re-checks AI surfaces for your monitored prompts. The headline score blends two
        parts:
      </p>

      <div className="mt-5 space-y-3">
        <div className="rounded-xl border border-border bg-surface/50 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-ink">
              Technical score · {breakdown.geoScore}/100
            </p>
            <span className="text-xs font-semibold text-muted">45% weight → {breakdown.technicalPoints} pts</span>
          </div>
          <p className="mt-1 text-xs text-muted">
            Meta tags, schema, H1, word count, sitemap — from your live HTML. Quick Fix schema
            only counts after the script tag is on your published site.
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-accent/80"
              style={{ width: `${Math.min(100, breakdown.geoScore)}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface/50 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-ink">
              Prompt citations · {breakdown.cited}/{breakdown.total} ({breakdown.citedPercent}%)
            </p>
            <span className="text-xs font-semibold text-muted">55% weight → {breakdown.citationPoints} pts</span>
          </div>
          <p className="mt-1 text-xs text-muted">
            Whether ChatGPT, Perplexity, and other AI answers mention you for your monitored
            prompts. This often lags on-site fixes by days or weeks.
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-mint"
              style={{ width: `${breakdown.citedPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-baseline gap-2 rounded-xl border border-accent/20 bg-accent/5 px-4 py-3">
        <p className="font-display text-2xl font-bold text-ink">
          {workspace.citationScore}
          <span className="text-sm font-normal text-muted">/100 citation score</span>
        </p>
        <p className="text-xs text-muted">
          ({breakdown.technicalPoints} technical + {breakdown.citationPoints} citation)
        </p>
      </div>

      {citationLimited && (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs leading-relaxed text-amber-950">
          Your technical score is strong, but prompt citations are low — that is usually why
          re-runs stay near {workspace.citationScore}/100 even after schema fixes. Focus on
          content that matches your money prompts, not just toggling Quick Fix.
        </p>
      )}
    </Panel>
  );
}
