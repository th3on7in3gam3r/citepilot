"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { trackEvent } from "@/lib/analytics/track";
import { effectInit } from "@/lib/react/effect-init";
import { notifyChecklistUpdate } from "@/components/dashboard/GettingStartedChecklist";
import { Panel } from "@/components/dashboard/DashboardUI";
import type { CmsProvider } from "@/lib/cms/types";
import { markGettingStartedStep } from "@/lib/getting-started";

type QueuePublication = {
  provider: CmsProvider;
  publishedAt: string;
  liveUrl: string | null;
  remoteId: string;
};

type QueuePost = {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  url: string;
  publications: QueuePublication[];
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

type CmsProviderStatus = {
  provider: CmsProvider;
  configured: boolean;
  connected: boolean;
  displayName?: string;
  siteUrl?: string;
  detail?: string;
};

type QueueFilter = "all" | "draft" | "webflow" | CmsProvider;

const providerLabels: Record<CmsProvider, string> = {
  wordpress: "WordPress",
  ghost: "Ghost",
  shopify: "Shopify",
  framer: "Framer",
};

function StatusBadge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "blog" | "live" | "draft";
}) {
  const styles = {
    blog: "bg-sky-50 text-sky-800",
    live: "bg-emerald-50 text-emerald-800",
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
  const [providers, setProviders] = useState<CmsProviderStatus[]>([]);
  const [filter, setFilter] = useState<QueueFilter>("all");
  const [publishingKey, setPublishingKey] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    const [postsRes, webflowRes, cmsRes] = await Promise.all([
      fetch(
        `/api/blog/posts?workspaceId=${encodeURIComponent(workspaceId)}&scope=workspace`,
        {
          credentials: "include",
        },
      ),
      fetch("/api/content/webflow/status"),
      fetch(`/api/content/cms?workspaceId=${encodeURIComponent(workspaceId)}`, {
        credentials: "include",
      }),
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

    if (cmsRes.ok) {
      const data = (await cmsRes.json()) as { providers?: CmsProviderStatus[] };
      setProviders(data.providers ?? []);
    } else {
      setProviders([]);
    }
  }, [workspaceId]);

  useEffect(() => {
    effectInit(() => {
      void load();
    });
  }, [load, refreshKey]);

  const webflowConfigured = Boolean(webflow?.configured);
  const webflowConnected = Boolean(webflow?.configured && webflow.connected);
  const counts = useMemo(() => {
    const next: Record<QueueFilter, number> = {
      all: posts.length,
      draft: posts.filter((post) => !post.webflow && post.publications.length === 0).length,
      webflow: posts.filter((post) => post.webflow).length,
      wordpress: posts.filter((post) =>
        post.publications.some((item) => item.provider === "wordpress"),
      ).length,
      ghost: posts.filter((post) =>
        post.publications.some((item) => item.provider === "ghost"),
      ).length,
      shopify: posts.filter((post) =>
        post.publications.some((item) => item.provider === "shopify"),
      ).length,
      framer: posts.filter((post) =>
        post.publications.some((item) => item.provider === "framer"),
      ).length,
    };
    return {
      ...next,
    };
  }, [posts]);

  const connectedProviders = useMemo(() => {
    const next: Array<{ id: QueueFilter; label: string }> = [];
    if (webflowConnected) {
      next.push({ id: "webflow", label: "Webflow" });
    }
    for (const provider of providers) {
      if (provider.connected) {
        next.push({
          id: provider.provider,
          label: providerLabels[provider.provider],
        });
      }
    }
    return next;
  }, [providers, webflowConnected]);

  useEffect(() => {
    const allowed = new Set<QueueFilter>([
      "all",
      "draft",
      ...connectedProviders.map((item) => item.id),
    ]);
    if (!allowed.has(filter)) {
      effectInit(() => setFilter("all"));
    }
  }, [connectedProviders, filter]);

  const filtered = useMemo(() => {
    if (filter === "draft") {
      return posts.filter((post) => !post.webflow && post.publications.length === 0);
    }
    if (filter === "webflow") return posts.filter((post) => post.webflow);
    if (filter !== "all") {
      return posts.filter((post) =>
        post.publications.some((item) => item.provider === filter),
      );
    }
    return posts;
  }, [posts, filter]);

  async function publishToProvider(
    provider: CmsProvider | "webflow",
    slug: string,
    isUpdate: boolean,
  ) {
    const label = provider === "webflow" ? "Webflow" : providerLabels[provider];
    setPublishingKey(`${provider}:${slug}`);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch(
        provider === "webflow"
          ? "/api/content/publish/webflow"
          : `/api/content/publish/${provider}`,
        {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ slug }),
      },
      );
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
            ? `Updated “${data.title}” on ${label} — ${data.liveUrl}`
            : `Updated “${data.title}” on ${label}`
          : data.liveUrl
            ? `Published “${data.title}” to ${label} — ${data.liveUrl}`
            : `Published “${data.title}” to ${label}`,
      );
      markGettingStartedStep("publishedCms");
      notifyChecklistUpdate();
      trackEvent("cms_published", { provider, slug });
      await load();
    } catch {
      setError("Network error — try again");
    } finally {
      setPublishingKey(null);
    }
  }

  const scopeError = webflow?.detail?.includes("scopes");

  function publicationFor(post: QueuePost, provider: CmsProvider) {
    return post.publications.find((item) => item.provider === provider) ?? null;
  }

  function publicationDate(post: QueuePost): string {
    const labels: string[] = [];
    if (post.webflow?.publishedAt) {
      labels.push(`Webflow ${new Date(post.webflow.publishedAt).toLocaleDateString()}`);
    }
    for (const publication of post.publications) {
      labels.push(
        `${providerLabels[publication.provider]} ${new Date(
          publication.publishedAt,
        ).toLocaleDateString()}`,
      );
    }
    return labels.join(" · ");
  }

  return (
    <Panel title="Article queue" className="mt-6">
      <p className="mb-4 text-sm text-muted">
        Generated drafts appear here after you use the generator. Push once to any
        connected CMS, then re-publish updates the same remote item instead of
        creating duplicates.
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

      {providers.some((provider) => provider.connected) && (
        <p className="mb-4 text-xs text-muted">
          Extra CMS:{" "}
          <span className="font-medium text-emerald-700">
            {providers
              .filter((provider) => provider.connected)
              .map((provider) => providerLabels[provider.provider])
              .join(", ")}
          </span>
        </p>
      )}

      {posts.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {[
            { id: "all" as const, label: `All (${counts.all})` },
            {
              id: "draft" as const,
              label: `Not on a CMS (${counts.draft})`,
            },
            ...connectedProviders.map((provider) => ({
              id: provider.id,
              label: `Live on ${provider.label} (${counts[provider.id]})`,
            })),
          ].map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                filter === id
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
                    {onWebflow && <StatusBadge tone="live">Live on Webflow</StatusBadge>}
                    {post.publications.map((publication) => (
                      <StatusBadge key={publication.provider} tone="live">
                        Live on {providerLabels[publication.provider]}
                      </StatusBadge>
                    ))}
                    {!onWebflow && post.publications.length === 0 && (
                      <StatusBadge tone="draft">CMS pending</StatusBadge>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">
                    {post.description}
                  </p>
                  <p className="mt-2 text-xs text-muted">
                    Draft {new Date(post.publishedAt).toLocaleDateString()}
                    {publicationDate(post) ? ` · ${publicationDate(post)}` : ""}
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
                  {post.publications.map(
                    (publication) =>
                      publication.liveUrl && (
                        <a
                          key={`${publication.provider}-view`}
                          href={publication.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full border border-border px-3 py-2 text-xs font-semibold text-ink hover:bg-surface"
                        >
                          View {providerLabels[publication.provider]} →
                        </a>
                      ),
                  )}
                  {webflowConfigured && (
                    <button
                      type="button"
                      disabled={publishingKey === `webflow:${post.slug}`}
                      onClick={() => void publishToProvider("webflow", post.slug, onWebflow)}
                      className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50"
                      title={
                        onWebflow
                          ? "Update existing Webflow CMS item"
                          : "Publish to Webflow CMS"
                      }
                    >
                      {publishingKey === `webflow:${post.slug}`
                        ? onWebflow
                          ? "Updating…"
                          : "Publishing…"
                        : onWebflow
                          ? "Sync to Webflow"
                          : "Publish to Webflow"}
                    </button>
                  )}
                  {providers
                    .filter((provider) => provider.connected)
                    .map((provider) => {
                      const publication = publicationFor(post, provider.provider);
                      const busy = publishingKey === `${provider.provider}:${post.slug}`;
                      return (
                        <button
                          key={provider.provider}
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            void publishToProvider(
                              provider.provider,
                              post.slug,
                              Boolean(publication),
                            )
                          }
                          className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-ink hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
                          title={
                            publication
                              ? `Update existing ${providerLabels[provider.provider]} item`
                              : `Publish to ${providerLabels[provider.provider]}`
                          }
                        >
                          {busy
                            ? publication
                              ? "Updating…"
                              : "Publishing…"
                            : publication
                              ? `Sync to ${providerLabels[provider.provider]}`
                              : `Publish to ${providerLabels[provider.provider]}`}
                        </button>
                      );
                    })}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}