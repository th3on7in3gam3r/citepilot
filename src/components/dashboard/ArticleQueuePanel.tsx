"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Panel } from "@/components/dashboard/DashboardUI";

type QueuePost = {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  url: string;
};

type WebflowStatus = {
  configured: boolean;
  connected: boolean;
  collectionName?: string;
  siteName?: string;
  detail?: string;
};

export function ArticleQueuePanel({
  workspaceId,
  refreshKey = 0,
}: {
  workspaceId: string;
  refreshKey?: number;
}) {
  const [posts, setPosts] = useState<QueuePost[]>([]);
  const [webflow, setWebflow] = useState<WebflowStatus | null>(null);
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

  async function publishToWebflow(slug: string) {
    setPublishingSlug(slug);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/content/publish/webflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        data.liveUrl
          ? `Published “${data.title}” to Webflow — ${data.liveUrl}`
          : `Published “${data.title}” to Webflow`,
      );
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
        Generated articles for this workspace. Publish to the CitePilot blog with
        the generator above, then push live to your Webflow CMS collection.
      </p>

      {webflow && !webflowConfigured && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-semibold">Webflow not configured</p>
          <p className="mt-1 text-amber-900">
            Add your three Webflow values to{" "}
            <code className="rounded bg-white/80 px-1.5 py-0.5 text-xs">.env.local</code>{" "}
            (project root), save the file, then restart{" "}
            <code className="rounded bg-white/80 px-1.5 py-0.5 text-xs">npm run dev</code>.
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-amber-900">
            <li>
              <code>WEBFLOW_API_KEY</code> — Webflow → Account → Integrations → API
              access token
            </li>
            <li>
              <code>WEBFLOW_SITE_ID</code> — your CitePilot site ID
            </li>
            <li>
              <code>WEBFLOW_COLLECTION_ID</code> — Blog Posts collection ID
            </li>
          </ul>
        </div>
      )}

      {webflow && webflowConfigured && !webflowConnected && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-semibold">
            {scopeError ? "Webflow API token needs more permissions" : "Webflow API check failed"}
          </p>
          {scopeError ? (
            <p className="mt-1 text-amber-900">
              Create a new token on your <strong>CitePilot site</strong> (not workspace
              account): Site settings → Integrations → API access → Generate token.
              Enable <strong>cms:write</strong> (required), plus{" "}
              <strong>sites:publish</strong> to push the live site. Paste into{" "}
              <code className="text-xs">WEBFLOW_API_KEY</code>, save, restart{" "}
              <code className="text-xs">npm run dev</code>.
            </p>
          ) : (
            <p className="mt-1 text-amber-900">
              Env vars are set — you can try Publish below. If it fails, verify your
              site and collection IDs.
            </p>
          )}
          {webflow.detail && (
            <p className="mt-2 text-xs text-amber-800">{webflow.detail}</p>
          )}
        </div>
      )}

      {webflow && (
        <p className="mb-4 text-xs text-muted">
          Webflow:{" "}
          {webflowConnected ? (
            <span className="font-medium text-emerald-700">
              Connected
              {webflow.siteName ? ` · ${webflow.siteName}` : ""}
              {webflow.collectionName ? ` · ${webflow.collectionName}` : ""}
            </span>
          ) : webflowConfigured ? (
            <span className="font-medium text-amber-700">
              Configured — {scopeError ? "token missing scopes" : "API check failed"}
            </span>
          ) : (
            <span className="font-medium text-muted">Not configured</span>
          )}
        </p>
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
      ) : (
        <ul className="divide-y divide-border">
          {posts.map((post) => (
            <li
              key={post.slug}
              className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <Link
                  href={post.url}
                  className="font-medium text-accent hover:underline"
                  target="_blank"
                >
                  {post.title}
                </Link>
                <p className="mt-1 line-clamp-2 text-sm text-muted">
                  {post.description}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-xs text-muted">
                  {new Date(post.publishedAt).toLocaleDateString()}
                </span>
                <button
                  type="button"
                  disabled={!webflowConfigured || publishingSlug === post.slug}
                  onClick={() => void publishToWebflow(post.slug)}
                  className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50"
                  title={
                    webflowConfigured
                      ? "Publish to Webflow CMS"
                      : "Add WEBFLOW_* keys to .env.local"
                  }
                >
                  {publishingSlug === post.slug ? "Publishing…" : "Publish to Webflow"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
