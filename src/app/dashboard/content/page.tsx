"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArticleQueuePanel } from "@/components/dashboard/ArticleQueuePanel";
import { DashboardPageHeader, Panel } from "@/components/dashboard/DashboardUI";
import { GenerateArticlePanel } from "@/components/dashboard/GenerateArticlePanel";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { buildContentCalendar } from "@/lib/dashboard-data";
import { buildWeeklyEditorialMix } from "@/lib/content-strategy";
import { cmsPlatforms, productFeatures } from "@/lib/features";

const contentFeature = productFeatures.find((f) => f.id === "content")!;
const strategyFeature = productFeatures.find((f) => f.id === "strategy")!;
const publishFeature = productFeatures.find((f) => f.id === "publishing")!;

type WebflowStatus = {
  configured: boolean;
  connected: boolean;
  siteName?: string;
  collectionName?: string;
  detail?: string;
};

export default function ContentPage() {
  const { workspace, ready } = useWorkspaceContext();
  const [webflow, setWebflow] = useState<WebflowStatus | null>(null);
  const [queueRefreshKey, setQueueRefreshKey] = useState(0);

  useEffect(() => {
    void fetch("/api/content/webflow/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setWebflow(data as WebflowStatus | null));
  }, []);

  if (!ready || !workspace) return null;

  const workspaceId = workspace.workspaceId ?? workspace.id;
  if (!workspaceId) return null;

  const calendar = buildContentCalendar(workspace);
  const editorialWeek = buildWeeklyEditorialMix();

  return (
    <>
      <DashboardPageHeader
        title="Content"
        description={`${contentFeature.description} Your workspace calendar closes citation gaps; CitePilot.com editorial runs the 6-pillar blog system.`}
        action={
          <Link
            href="/blog"
            className="text-sm font-semibold text-accent hover:text-accent-deep"
          >
            CitePilot blog →
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <FeatureCard title="Branded SEO Content" body={contentFeature.description} />
        <FeatureCard title="30–Day Strategy" body={strategyFeature.description} />
        <FeatureCard title="Automated Publishing" body={publishFeature.description} />
      </div>

      <GenerateArticlePanel
        workspaceId={workspaceId}
        onGenerated={() => setQueueRefreshKey((k) => k + 1)}
      />

      <Panel title="CitePilot editorial mix (site blog)" className="mt-6">
        <p className="mb-4 text-sm text-muted">
          Template cadence for getcitepilot.com — 3–5 posts/week across GEO, SEO,
          technical, local, paid, and agency pillars. Use the generator above to
          publish directly to the blog.
        </p>
        <ul className="divide-y divide-border text-sm">
          {editorialWeek.map((slot) => (
            <li
              key={slot.day}
              className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:justify-between"
            >
              <div>
                <span className="font-semibold text-ink">{slot.day}</span>
                <span className="text-muted"> · {slot.pillarTitle}</span>
                <p className="text-xs text-muted">{slot.topicTemplate}</p>
              </div>
              <span className="shrink-0 text-xs font-medium text-accent">
                {slot.contentType}
              </span>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="30-day content calendar" className="mt-6">
        <ul className="divide-y divide-border">
          {calendar.map((c) => (
            <li
              key={c.week}
              className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-xs font-semibold text-muted">{c.week}</p>
                <p className="font-medium text-ink">{c.topic}</p>
                <p className="mt-1 text-xs text-muted">{c.rationale}</p>
              </div>
              <span className="shrink-0 rounded-full bg-surface px-3 py-1 text-xs font-semibold text-muted">
                {c.format}
              </span>
            </li>
          ))}
        </ul>
      </Panel>

      <ArticleQueuePanel workspaceId={workspaceId} refreshKey={queueRefreshKey} />

      <Panel title="CMS connections" className="mt-6">
        <p className="mb-3 text-sm text-muted">
          Push generated articles from CitePilot to your marketing site CMS.
        </p>
        <div className="flex flex-wrap gap-2">
          {cmsPlatforms.map((cms) => {
            const isWebflow = cms === "Webflow";
            const connected = isWebflow && webflow?.configured && webflow?.connected;
            const pending = isWebflow && webflow?.configured && !webflow.connected;
            return (
              <span
                key={cms}
                className={`rounded-full border px-4 py-2 text-sm font-medium ${
                  connected
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : pending
                      ? "border-amber-200 bg-amber-50 text-amber-800"
                      : "border-border bg-surface text-ink opacity-60"
                }`}
                title={
                  isWebflow && webflow?.detail
                    ? webflow.detail
                    : connected
                      ? `${webflow?.siteName ?? "Site"} · ${webflow?.collectionName ?? "Blog Posts"}`
                      : undefined
                }
              >
                {cms}
                {connected
                  ? " · connected"
                  : isWebflow && webflow?.configured
                    ? " · fix token scopes"
                    : ""}
              </span>
            );
          })}
        </div>
      </Panel>
    </>
  );
}

function FeatureCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <h3 className="font-display font-bold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
    </div>
  );
}
