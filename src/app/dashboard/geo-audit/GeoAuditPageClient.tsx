"use client";

import Link from "next/link";
import { DashboardPageHeader, Panel, StatCard } from "@/components/dashboard/DashboardUI";
import { CopilotInsight } from "@/components/dashboard/CopilotInsight";
import { ShareAuditPanel } from "@/components/dashboard/ShareAuditPanel";
import { getStoredWorkspaceId } from "@/lib/client/api";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { productFeatures } from "@/lib/features";

const feature = productFeatures.find((f) => f.id === "geo-audit")!;

const fallbackGaps = [
  "Missing FAQPage schema on key landing pages",
  "No concise answer capsule (40–60 words) above the fold",
  "Weak entity signals on review and community sites",
  "Competitor cited on more platforms for your top prompt",
];

export function GeoAuditPageClient() {
  const { workspace, ready, refresh } = useWorkspaceContext();
  if (!ready || !workspace) return null;

  const gaps = workspace.gaps.length > 0 ? workspace.gaps : fallbackGaps;
  const geoScore = workspace.siteSignals?.geoScore ?? workspace.citationScore;
  const workspaceId =
    workspace.workspaceId ?? workspace.id ?? getStoredWorkspaceId() ?? undefined;

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
      <div className="grid gap-4 sm:grid-cols-3">
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
      <Panel title="Priority fixes" className="mt-6">
        <p className="mb-4 text-sm text-muted">
          From your latest audit. Use CitePilot Insights for a plain-language
          explanation of any gap (Pilot+, or one free preview on Free).
        </p>
        <ul className="space-y-3 text-sm text-muted">
          {gaps.map((g) => (
            <li key={g} className="rounded-xl bg-surface px-4 py-3">
              <div className="flex gap-3">
                <span className="text-accent">•</span>
                <span className="flex-1 text-ink">{g}</span>
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
    </>
  );
}
