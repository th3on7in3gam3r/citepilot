"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { notifyChecklistUpdate } from "@/components/dashboard/GettingStartedChecklist";
import { Panel } from "@/components/dashboard/DashboardUI";
import { markGettingStartedStep } from "@/lib/getting-started";

type QueuePost = {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  url: string;
  webflow: {
    publishedAt: string;
    liveUrl: string | null;
    itemId: string | null;
  } | null;
};

type WebflowStatus = {
  configured: boolean;
  connected: boolean;
  collectionName?: string;
  siteName?: string;
  detail?: string;
};

type QueueFilter = "all" | "draft" | "webflow";

function StatusBadge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "blog" | "webflow" | "draft";
}) {
  const styles = {
    blog: "bg-sky-50 text-sky-800",
    webflow: "bg-emerald-50 text-emerald-800",
    draft: "bg-surface text-muted",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${styles[tone]}`}
    >
      {children}
    </span>
  );
}

export function ArticleQueuePanel({
  workspaceId,
  refreshKey = 0,
}: {
  workspaceId: string;
  refreshKey?: number;
}) {
  const [posts, setPosts] = useState<QueuePost[]>([]);
  const [webflow, setWebflow] = useState<WebflowStatus | null>(null);
  const [filter, setFilter] = useState<QueueFilter>("all");
  const [publishingSlug, setPublishingSlug] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    const [postsRes, webflowRes] = await Promise.all([
      fetch(`/api/blog/posts?workspaceId=${encodeURIComponent(workspaceId)}`, {
        credentials: "include",
      }),
      fetch("/api/content/webflow/status"),
    ]);

    if (postsRes.ok) {
      const data = (await postsRes.json()) as { posts: QueuePost[] };
      setPosts(data.posts);
    } else {
      const data = (await postsRes.json().catch(() => ({}))) as { error?: string };
      setLoadError(data.error ?? `Could not load articles (${postsRes.status})`);
      setPosts([]);
    }

    if (webflowRes.ok) {
      setWebflow((await webflowRes.json()) as WebflowStatus);
    }
  }, [workspaceId]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const counts = useMemo(() => {
    const webflowCount = posts.filter((p) => p.webflow).length;
    return {
      all: posts.length,
      webflow: webflowCount,
      draft: posts.length - webflowCount,
    };
  }, [posts]);

  const filtered = useMemo(() => {
    if (filter === "webflow") return posts.filter((p) => p.webflow);
    if (filter === "draft") return posts.filter((p) => !p.webflow);
    return posts;
  }, [posts, filter]);

  async function publishToWebflow(slug: string, isUpdate: boolean) {
    setPublishingSlug(slug);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/content/publish/webflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ slug }),
      });
      const data = (await res.json()) as {
        error?: string;
        liveUrl?: string;
        title?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Publish failed");
        return;
      }
      setMessage(
        isUpdate
          ? data.liveUrl
            ? `Updated “${data.title}” on Webflow — ${data.liveUrl}`
            : `Updated “${data.title}” on Webflow`
          : data.liveUrl
            ? `Published “${data.title}” to Webflow — ${data.liveUrl}`
            : `Published “${data.title}” to Webflow`,
      );
      markGettingStartedStep("publishedWebflow");
      notifyChecklistUpdate();
      await load();
    } catch {
      setError("Network error — try again");
    } finally {
      setPublishingSlug(null);
    }
  }

  const webflowConfigured = Boolean(webflow?.configured);
  const webflowConnected = Boolean(webflow?.configured && webflow.connected);
  const scopeError = webflow?.detail?.includes("scopes");

  return (
    <Panel title="Article queue" className="mt-6">
      <p className="mb-4 text-sm text-muted">
        Generated drafts appear here after you use the generator. Push once to
        Webflow — republish updates the same CMS item (no duplicates).
      </p>

      {webflow && !webflowConfigured && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-semibold">Webflow not configured</p>
          <p className="mt-1 text-amber-900">
            Set <code className="text-xs">WEBFLOW_*</code> in Vercel env vars
            (or <code className="text-xs">.env.local</code> locally), then redeploy.
          </p>
        </div>
      )}

      {webflow && webflowConfigured && !webflowConnected && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-semibold">
            {scopeError ? "Webflow token needs cms:write" : "Webflow API check failed"}
          </p>
          {webflow.detail && (
            <p className="mt-2 text-xs text-amber-800">{webflow.detail}</p>
          )}
        </div>
      )}

      {webflow && webflowConnected && (
        <p className="mb-4 text-xs text-muted">
          Webflow:{" "}
          <span className="font-medium text-emerald-700">
            Connected
            {webflow.siteName ? ` · ${webflow.siteName}` : ""}
            {webflow.collectionName ? ` · ${webflow.collectionName}` : ""}
          </span>
        </p>
      )}

      {posts.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {(
            [
              ["all", `All (${counts.all})`],
              ["draft", `Not on Webflow (${counts.draft})`],
              ["webflow", `Live on Webflow (${counts.webflow})`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                filter === key
                  ? "bg-ink text-white"
                  : "bg-surface text-muted hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {loadError && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {loadError}
        </p>
      )}

      {message && (
        <p className="mb-4 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-ink">
          {message}
        </p>
      )}
      {error && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {posts.length === 0 ? (
        <p className="text-sm text-muted">
          No articles yet — use Generate article above to create your first post.
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted">
          No articles match this filter.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {filtered.map((post) => {
            const onWebflow = Boolean(post.webflow);
            return (
              <li
                key={post.slug}
                className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={post.url}
                      className="font-medium text-accent hover:underline"
                      target="_blank"
                    >
                      {post.title}
                    </Link>
                    <StatusBadge tone="blog">CitePilot blog</StatusBadge>
                    {onWebflow ? (
                      <StatusBadge tone="webflow">Live on Webflow</StatusBadge>
                    ) : (
                      <StatusBadge tone="draft">Webflow pending</StatusBadge>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">
                    {post.description}
                  </p>
                  <p className="mt-2 text-xs text-muted">
                    Draft {new Date(post.publishedAt).toLocaleDateString()}
                    {onWebflow && post.webflow?.publishedAt
                      ? ` · Webflow ${new Date(post.webflow.publishedAt).toLocaleDateString()}`
                      : ""}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {onWebflow && post.webflow?.liveUrl && (
                    <a
                      href={post.webflow.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border border-border px-3 py-2 text-xs font-semibold text-ink hover:bg-surface"
                    >
                      View live →
                    </a>
                  )}
                  <button
                    type="button"
                    disabled={!webflowConfigured || publishingSlug === post.slug}
                    onClick={() => void publishToWebflow(post.slug, onWebflow)}
                    className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50"
                    title={
                      webflowConfigured
                        ? onWebflow
                          ? "Update existing Webflow CMS item"
                          : "Publish to Webflow CMS"
                        : "Webflow not configured"
                    }
                  >
                    {publishingSlug === post.slug
                      ? onWebflow
                        ? "Updating…"
                        : "Publishing…"
                      : onWebflow
                        ? "Sync to Webflow"
                        : "Publish to Webflow"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}