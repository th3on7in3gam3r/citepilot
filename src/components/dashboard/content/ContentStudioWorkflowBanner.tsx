"use client";

import Link from "next/link";
import { useBilling } from "@/contexts/BillingContext";
import {
  useUpgradeModalOptional,
} from "@/contexts/UpgradeModalContext";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { DashboardActivationStrip } from "@/components/dashboard/layout/DashboardActivationStrip";

export function ContentStudioWorkflowBanner({
  onGenerateClick,
}: {
  onGenerateClick?: () => void;
}) {
  const { workspace } = useWorkspaceContext();
  const { isPaid, ready } = useBilling();
  const upgradeModal = useUpgradeModalOptional();
  const hasAudit = Boolean(workspace?.hasRealAudit);

  function handleGenerate() {
    if (ready && !isPaid) {
      upgradeModal?.openUpgradeModal({
        feature: "article_generation",
        title: "AI article generation",
        description:
          "Pilot and Fleet unlock citation-ready article drafts from your money prompts and GEO gaps.",
        plan: "pilot",
        unlocks: [
          "Generate articles from uncited money prompts",
          "Queue drafts for CMS publish",
          "Briefs tied to Site Optimizer gaps",
        ],
      });
      return;
    }
    onGenerateClick?.();
  }

  return (
    <div className="mb-5 space-y-4">
      {!hasAudit && (
        <DashboardActivationStrip
          title="Run a GEO audit before drafting"
          description="Content Studio works best from live citation gaps. Audit first, then generate articles from uncited money prompts."
          primaryHref="/dashboard/geo-audit"
          primaryLabel="Run GEO audit →"
          secondaryHref="/dashboard/content?section=targeting"
          secondaryLabel="Edit money prompts"
        />
      )}
      <div className="rounded-2xl border border-accent/20 bg-accent/5 px-4 py-3 dark:border-accent/25 dark:bg-accent/10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              Content Studio workflow
            </p>
            <p className="mt-1 text-sm text-muted">
              <Link href="/dashboard/optimizer" className="font-semibold text-ink hover:text-accent">
                Site Optimizer
              </Link>{" "}
              turns audit gaps into briefs. Generate articles here, queue drafts, and publish to your CMS.
            </p>
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            className="inline-flex shrink-0 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-deep"
          >
            {ready && !isPaid ? "Upgrade to generate →" : "Generate article →"}
          </button>
        </div>
      </div>
    </div>
  );
}
