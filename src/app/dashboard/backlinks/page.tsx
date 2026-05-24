"use client";

import { DashboardPageHeader, Panel } from "@/components/dashboard/DashboardUI";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { domainSeed } from "@/lib/dashboard";
import { productFeatures } from "@/lib/features";

const feature = productFeatures.find((f) => f.id === "backlinks")!;

export default function BacklinksPage() {
  const { workspace, ready } = useWorkspaceContext();
  if (!ready || !workspace) return null;

  const seed = domainSeed(workspace.domain);
  const network = [
    workspace.domain,
    ...workspace.competitors.slice(0, 3),
    `partner-${seed % 97}.io`,
    `network-${(seed % 50) + 10}.co`,
  ].filter((v, i, a) => a.indexOf(v) === i);

  const credits = 100;
  const used = Math.min(credits, 12 + workspace.sourceCount);

  return (
    <>
      <DashboardPageHeader title="Backlinks" description={feature.description} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Domain authority">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Domain rating
          </p>
          <p className="font-display mt-2 text-5xl font-bold text-ink">
            {workspace.domainRating}
          </p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-500"
              style={{ width: `${Math.min(100, workspace.domainRating)}%` }}
            />
          </div>
          <p className="mt-3 text-sm font-medium text-mint">
            {workspace.hasRealAudit
              ? `Derived from GEO score (${workspace.visibilityScore}/100) on latest audit`
              : "Run an audit to baseline domain authority from your site"}
          </p>
        </Panel>

        <Panel title="Backlink credits">
          <p className="font-display text-3xl font-bold text-ink">
            {credits - used}
            <span className="text-lg font-normal text-muted"> / {credits}</span>
          </p>
          <p className="mt-2 text-sm text-muted">
            Credits to receive contextual backlinks across the CitePilot network.
          </p>
          <button
            type="button"
            className="mt-4 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white opacity-60"
            title="Network matching ships with Pilot billing"
          >
            Request placement
          </button>
        </Panel>
      </div>

      <Panel title="Network preview" className="mt-6">
        <p className="mb-4 text-sm text-muted">
          Sites in your citation neighborhood — including competitors you track.
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {network.map((site) => (
            <li
              key={site}
              className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 text-sm"
            >
              <span className="font-medium text-ink">{site}</span>
              <span className="text-xs text-muted">
                {site === workspace.domain ? "You" : "Peer"}
              </span>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
