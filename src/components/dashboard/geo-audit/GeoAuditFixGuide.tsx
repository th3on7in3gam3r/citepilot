"use client";

import Link from "next/link";
import type { WorkspaceSnapshot } from "@/lib/dashboard";
import { Panel } from "@/components/dashboard/DashboardUI";
import { geoSnippetScriptUrl } from "@/lib/geo/snippet";

export function GeoAuditFixGuide({ workspace }: { workspace: WorkspaceSnapshot }) {
  const workspaceId = workspace.workspaceId ?? workspace.id;
  const snippetFixes =
    workspace.preferences?.geoSnippetFixes ??
    workspace.preferences?.appliedFixes ??
    [];
  const hasSnippetBundle = snippetFixes.length > 0;
  const schemaOnLiveSite =
    workspace.siteSignals?.hasJsonLd &&
    (workspace.siteSignals.hasFaqSchema || workspace.siteSignals.hasOrganizationSchema);

  return (
    <Panel title="When fixes actually update your score" className="mt-6">
      <ol className="space-y-4 text-sm text-muted">
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
            1
          </span>
          <div>
            <p className="font-semibold text-ink">Content guides need live published copy</p>
            <p className="mt-0.5 leading-relaxed">
              Content guide gaps clear when your <strong className="text-ink">published homepage</strong>{" "}
              includes matching buyer language (we scan title, meta, H1, and body text). That
              can improve technical signals and on-site prompt alignment — but{" "}
              <strong className="text-ink">55% of your score</strong> still comes from whether
              AI engines actually cite you on live probes, which may not move immediately.
            </p>
          </div>
        </li>
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
            2
          </span>
          <div>
            <p className="font-semibold text-ink">GEO Snippet needs the script tag</p>
            <p className="mt-0.5 leading-relaxed">
              Toggling fixes in Quick Fix only updates your hosted bundle. We detect it when{" "}
              <code className="rounded bg-surface px-1 text-xs text-ink">
                {workspaceId ? geoSnippetScriptUrl(workspaceId) : "/geo/your-workspace.js"}
              </code>{" "}
              is in your homepage HTML.
            </p>
            {hasSnippetBundle && !schemaOnLiveSite && (
              <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-950">
                You have {snippetFixes.length} fix{snippetFixes.length === 1 ? "" : "es"} in
                your snippet bundle, but we did not detect the script or schema on your live
                homepage yet.
              </p>
            )}
          </div>
        </li>
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
            3
          </span>
          <div>
            <p className="font-semibold text-ink">Check “Since your last scan” below</p>
            <p className="mt-0.5 leading-relaxed">
              Cleared gaps mean the live crawl saw your fix. No score change usually means
              citations (55% of the score) did not move yet.
            </p>
          </div>
        </li>
      </ol>
      <Link
        href="/help/public-score-pages"
        className="mt-4 inline-flex text-xs font-semibold text-accent hover:text-accent-deep"
      >
        DNS &amp; score page guide →
      </Link>
    </Panel>
  );
}
