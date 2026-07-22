import Link from "next/link";
import type { WorkspaceSnapshot } from "@/lib/dashboard";
import { CiteStatusBadge } from "@/components/dashboard/CiteStatusBadge";
import { dashPrimaryCta, dashSecondaryCta } from "@/lib/dashboard/surface-classes";

export function DashboardOverviewLead({ workspace }: { workspace: WorkspaceSnapshot }) {
  const updated = workspace.updatedAt
    ? new Date(workspace.updatedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div
      data-tour="workspace"
      className="dash-content-card flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-sm font-bold text-accent">
          {workspace.domain.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-display text-base font-bold text-ink">
              {workspace.domain}
            </p>
            {workspace.hasRealAudit && (
              <CiteStatusBadge score={workspace.citationScore} size="sm" />
            )}
          </div>
          <p className="mt-0.5 text-sm text-muted">
            {workspace.hasRealAudit ? (
              <>
                Citation score{" "}
                <span className="font-semibold text-accent">{workspace.citationScore}</span>
                {" · "}
                {workspace.promptsTracked} prompts tracked
              </>
            ) : (
              "Estimates until your first audit completes"
            )}
          </p>
          {!workspace.hasRealAudit && (
            <p className="mt-1 text-xs text-muted">
              Run a GEO audit for measured platform data.{" "}
              <Link
                href="/dashboard/geo-audit"
                className="font-semibold text-accent hover:underline"
              >
                Open GEO audit →
              </Link>
            </p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {updated && (
          <span className="rounded-lg border border-border bg-[var(--dashboard-bg)] px-3 py-1.5 text-xs font-medium text-muted">
            Updated {updated}
          </span>
        )}
        <Link href="/dashboard/geo-audit" className={`${dashPrimaryCta} px-3.5 py-2 text-xs`}>
          {workspace.hasRealAudit ? "Run new scan →" : "Run first audit →"}
        </Link>
        <Link href="/dashboard/help" className={`${dashSecondaryCta} px-3.5 py-2 text-xs`}>
          Help guide
        </Link>
      </div>
    </div>
  );
}
