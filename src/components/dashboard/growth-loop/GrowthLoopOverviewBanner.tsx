import Link from "next/link";
import type { WorkspaceSnapshot } from "@/lib/dashboard";

export function GrowthLoopOverviewBanner({
  workspace,
}: {
  workspace: WorkspaceSnapshot;
}) {
  if (workspace.preferences.growthLoop?.enabled) return null;

  return (
    <div className="dash-content-card flex flex-col gap-3 border-accent/25 bg-accent/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">
          Growth Loop
        </p>
        <p className="mt-1 font-display text-base font-bold text-ink">
          Paste your URL once — daily SEO articles & AI visibility on autopilot
        </p>
        <p className="mt-1 text-sm text-muted">
          Auto-publish to your site, request backlinks, and track ChatGPT & Perplexity citations.
        </p>
      </div>
      <Link
        href="/dashboard/growth-loop"
        className="shrink-0 rounded-full bg-ink px-5 py-2.5 text-center text-sm font-semibold text-white hover:bg-ink/90"
      >
        Set up Growth Loop
      </Link>
    </div>
  );
}
