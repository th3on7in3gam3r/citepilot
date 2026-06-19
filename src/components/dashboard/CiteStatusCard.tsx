"use client";

import Link from "next/link";
import type { WorkspaceSnapshot } from "@/lib/dashboard";
import { publicScorePageUrl } from "@/lib/score/public-score-url";
import {
  citeStatusTier,
  progressWithinTier,
} from "@/lib/score/cite-status";
import { CiteStatusBadge } from "@/components/dashboard/CiteStatusBadge";
import { CiteStatusMilestones } from "@/components/dashboard/CiteStatusMilestones";

export function CiteStatusCard({ workspace }: { workspace: WorkspaceSnapshot }) {
  if (!workspace.hasRealAudit) return null;

  const tier = citeStatusTier(workspace.citationScore);
  const progress = progressWithinTier(workspace.citationScore);
  const showShare = tier.id === "highly-citeable" || workspace.citationScore >= 71;

  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <div className="border-b border-border bg-surface/40 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
              Cite status
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <CiteStatusBadge score={workspace.citationScore} />
              <p className="font-display text-3xl font-bold tracking-tight text-ink">
                {workspace.citationScore}
                <span className="text-lg font-semibold text-muted">/100</span>
              </p>
            </div>
          </div>
          {showShare && (
            <Link
              href={publicScorePageUrl(workspace.domain)}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-full border border-accent/30 bg-white px-4 py-2 text-xs font-semibold text-accent transition hover:bg-accent/5"
            >
              Share score page →
            </Link>
          )}
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{tier.description}</p>
      </div>

      <div className="px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-3 text-xs font-medium text-muted">
          <span>{progress.label}</span>
          {tier.nextTierAt != null && (
            <span>
              Next: <span className="font-semibold text-ink">{tier.nextTierLabel}</span> at{" "}
              {tier.nextTierAt}
            </span>
          )}
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface">
          <div
            className={`h-full rounded-full transition-all ${tier.progressClass}`}
            style={{ width: `${progress.percent}%` }}
          />
        </div>
        <CiteStatusMilestones workspace={workspace} />
      </div>
    </section>
  );
}
