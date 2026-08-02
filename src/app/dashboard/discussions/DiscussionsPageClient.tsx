"use client";

import { useEffect, useState } from "react";
import { effectInit } from "@/lib/react/effect-init";
import { DashboardPageHeader, Panel } from "@/components/dashboard/DashboardUI";
import { DashboardActivationStrip } from "@/components/dashboard/layout/DashboardActivationStrip";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { DashboardNoWorkspaceEmpty } from "@/components/dashboard/layout/DashboardNoWorkspaceEmpty";
import { notifyChecklistUpdate } from "@/components/dashboard/GettingStartedChecklist";
import type { DiscussionThread } from "@/lib/api-types";
import { productFeatures } from "@/lib/features";

const feature = productFeatures.find((f) => f.id === "discussions")!;

const sourceStyle: Record<DiscussionThread["source"], string> = {
  hackernews: "bg-orange-50 text-orange-800",
  stackexchange: "bg-amber-50 text-amber-900",
  serper: "bg-sky-50 text-sky-900",
  serpapi: "bg-sky-50 text-sky-900",
  tavily: "bg-violet-50 text-violet-900",
};

export function DiscussionsPageClient() {
  const { workspace, ready } = useWorkspaceContext();
  const [threads, setThreads] = useState<DiscussionThread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notifyChecklistUpdate();
  }, []);

  useEffect(() => {
    if (!workspace) return;
    const query = workspace.buyerQuestion || workspace.domain;
    effectInit(() => setLoading(true));
    fetch(`/api/discussions?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((data: { threads: DiscussionThread[] }) =>
        setThreads(data.threads ?? []),
      )
      .catch(() => setThreads([]))
      .finally(() => setLoading(false));
  }, [workspace]);

  if (!ready) {
    return <div className="h-64 animate-pulse rounded-2xl bg-surface" />;
  }
  if (!workspace) {
    return (
      <DashboardNoWorkspaceEmpty description="Create a workspace to scan buyer-intent discussions for your domain." />
    );
  }

  return (
    <>
      <DashboardPageHeader
        headingLevel="h2"
        title="Buyer discussion radar"
        description={feature.description}
        action={
          <button
            type="button"
            onClick={() => {
              if (!workspace) return;
              const query = workspace.buyerQuestion || workspace.domain;
              setLoading(true);
              void fetch(`/api/discussions?q=${encodeURIComponent(query)}`)
                .then((r) => r.json())
                .then((data: { threads: DiscussionThread[] }) =>
                  setThreads(data.threads ?? []),
                )
                .catch(() => setThreads([]))
                .finally(() => setLoading(false));
            }}
            disabled={loading}
            className="rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-deep disabled:opacity-50"
          >
            {loading ? "Scanning…" : "Scan again →"}
          </button>
        }
      />
      {!workspace.hasRealAudit && (
        <DashboardActivationStrip
          title="Scan works better after an audit"
          description="We search HN, Stack Overflow, and the web using your money prompt. Run a GEO audit first so buyer-question targeting matches live citation gaps."
          primaryHref="/dashboard/geo-audit"
          primaryLabel="Run GEO audit →"
          secondaryHref="/dashboard/settings"
          secondaryLabel="Edit buyer question"
        />
      )}
      <Panel title="Buyer-intent threads">
        <p className="mb-4 text-sm text-muted">
          Threads from <strong className="text-ink">Hacker News</strong>,{" "}
          <strong className="text-ink">Stack Overflow</strong>, and{" "}
          <strong className="text-ink">web search</strong> (
          <code className="text-xs">SERPER_API_KEY</code>,{" "}
          <code className="text-xs">SERPAPI_API_KEY</code>, or{" "}
          <code className="text-xs">TAVILY_API_KEY</code>) for &ldquo;
          {workspace.buyerQuestion || workspace.domain}&rdquo;.
        </p>
        {loading && (
          <p className="text-sm text-muted">Searching discussions…</p>
        )}
        {!loading && threads.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-surface px-4 py-6 text-center">
            <p className="text-sm text-muted">
              No threads found yet — refine your buyer question, or ensure a search
              API key is configured for broader coverage.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <a
                href="/dashboard/settings"
                className="inline-flex rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-deep"
              >
                Edit buyer question →
              </a>
              <a
                href="/dashboard/geo-audit"
                className="inline-flex text-sm font-semibold text-accent hover:underline"
              >
                Run GEO audit
              </a>
            </div>
          </div>
        )}
        <ul className="space-y-3">
          {threads.map((t) => (
            <li
              key={t.id}
              className="flex flex-col gap-2 rounded-xl border border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${sourceStyle[t.source]}`}
                >
                  {t.sourceLabel}
                </span>
                <p className="mt-2 text-sm font-medium text-ink">{t.title}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-xs">
                <span className="text-muted">
                  {t.score} pts · {t.comments} replies
                </span>
                <a
                  href={t.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-ink px-3 py-1.5 font-semibold text-white"
                >
                  Open →
                </a>
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
