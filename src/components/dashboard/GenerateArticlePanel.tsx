"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { FeatureGate } from "@/components/billing/FeatureGate";
import { notifyChecklistUpdate } from "@/components/dashboard/GettingStartedChecklist";
import { Panel } from "@/components/dashboard/DashboardUI";
import { useBilling } from "@/contexts/BillingContext";
import {
  buildGenerateContentOpportunities,
  editorialWeekLabel,
} from "@/lib/content-strategy/opportunities";
import {
  AUDIENCE_LABELS,
  CONTENT_TYPE_LABELS,
  EDITORIAL_PILLARS,
} from "@/lib/content-strategy";
import type {
  AudienceSegment,
  ContentType,
  EditorialPillarId,
} from "@/lib/content-strategy";
import { useToast } from "@/components/notifications/ToastProvider";
import type { WorkspaceSnapshot } from "@/lib/dashboard";

type GenerateResult = {
  post: { slug: string; title: string; url: string };
  cmsUrl?: string | null;
};

export function GenerateArticlePanel({
  workspaceId,
  workspace,
  onGenerated,
}: {
  workspaceId?: string;
  workspace?: WorkspaceSnapshot;
  onGenerated?: () => void;
}) {
  const searchParams = useSearchParams();
  const [topic, setTopic] = useState("");
  const [angle, setAngle] = useState("");
  const [audience, setAudience] = useState<AudienceSegment>("solo-founder");
  const [contentType, setContentType] = useState<ContentType>("tutorial");
  const [pillar, setPillar] = useState<EditorialPillarId>("geo");
  const toast = useToast();
  const { isPaid, ready: billingReady } = useBilling();
  const [loading, setLoading] = useState(false);
  const [publishingToCms, setPublishingToCms] = useState(false);
  const [result, setResult] = useState<GenerateResult | null>(null);

  const [connectedCms, setConnectedCms] = useState<{ provider: string; label: string } | null>(null);
  const [autoPublish, setAutoPublish] = useState(true);

  // Load configuration from URL query params when they change
  useEffect(() => {
    const pTopic = searchParams.get("topic");
    const pAngle = searchParams.get("angle");
    const pBrief = searchParams.get("brief");
    const pFormat = searchParams.get("format");
    const pPillar = searchParams.get("pillar");

    if (!pTopic && !pAngle && !pBrief && !pFormat && !pPillar) return;

    const t = setTimeout(() => {
      if (pTopic) setTopic(pTopic);
      if (pBrief) {
        setAngle(pBrief);
      } else if (pAngle) {
        setAngle(pAngle);
      }
      if (pFormat && pFormat in CONTENT_TYPE_LABELS) {
        setContentType(pFormat as ContentType);
      }
      if (pPillar && EDITORIAL_PILLARS.some((p) => p.id === pPillar)) {
        setPillar(pPillar as EditorialPillarId);
      }
    }, 0);
    return () => clearTimeout(t);
  }, [searchParams]);

  // Fetch CMS connection statuses on mount to check if any CMS is active
  useEffect(() => {
    if (!workspaceId) return;
    let active = true;

    async function checkCms() {
      try {
        const [webflowRes, cmsRes] = await Promise.all([
          fetch("/api/content/webflow/status"),
          fetch(`/api/content/cms?workspaceId=${encodeURIComponent(workspaceId!)}`, {
            credentials: "include",
          }),
        ]);
        if (!active) return;

        if (webflowRes.ok) {
          const webflow = await webflowRes.json() as { configured: boolean; connected: boolean };
          if (webflow.configured && webflow.connected) {
            setConnectedCms({ provider: "webflow", label: "Webflow" });
            return;
          }
        }

        if (cmsRes.ok) {
          const data = await cmsRes.json() as { providers?: { provider: string; connected: boolean }[] };
          const connected = (data.providers ?? []).find((p) => p.connected);
          if (connected) {
            const providerLabels: Record<string, string> = {
              wordpress: "WordPress",
              signaldesk: "SignalDesk",
              webflow: "Webflow",
              ghost: "Ghost",
              hashnode: "Hashnode",
              shopify: "Shopify",
              framer: "Framer",
            };
            setConnectedCms({
              provider: connected.provider,
              label: providerLabels[connected.provider] ?? connected.provider,
            });
          }
        }
      } catch (err) {
        console.error("Failed to load CMS status", err);
      }
    }

    void checkCms();
    return () => {
      active = false;
    };
  }, [workspaceId]);

  // Rotating editorial opportunities — workspace + weekly + audience/format/pillar mix
  const { suggestions, weekLabel } = useMemo(() => {
    if (!workspace) return { suggestions: [], weekLabel: "" };
    return {
      suggestions: buildGenerateContentOpportunities(workspace),
      weekLabel: editorialWeekLabel(),
    };
  }, [workspace]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) {
      toast.error("Enter a topic");
      return;
    }
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          angle: angle.trim() || undefined,
          audience,
          contentType,
          pillar,
          workspaceId,
          publish: true,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        post?: { slug: string; title: string; url: string };
      };
      if (!res.ok) {
        const fallback =
          res.status === 502 || res.status === 504
            ? "Generation timed out or failed upstream — try News/Tutorial format or retry in a minute."
            : "Generation failed";
        toast.error(data.error ?? fallback);
        setLoading(false);
        return;
      }

      if (data.post) {
        let publishedLiveUrl: string | null = null;
        let publishError: string | null = null;

        if (connectedCms && autoPublish) {
          setPublishingToCms(true);
          try {
            const pubRes = await fetch(
              connectedCms.provider === "webflow"
                ? "/api/content/publish/webflow"
                : `/api/content/publish/${connectedCms.provider}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ slug: data.post.slug }),
              }
            );
            const pubData = await pubRes.json() as { error?: string; liveUrl?: string };
            if (pubRes.ok && pubData.liveUrl) {
              publishedLiveUrl = pubData.liveUrl;
            } else {
              publishError = pubData.error ?? "CMS publishing failed";
            }
          } catch {
            publishError = "Network error during CMS publishing";
          } finally {
            setPublishingToCms(false);
          }
        }

        setResult({
          post: data.post,
          cmsUrl: publishedLiveUrl,
        });

        onGenerated?.();
        notifyChecklistUpdate();

        if (publishedLiveUrl) {
          toast.success(`Generated & published to ${connectedCms?.label}`, {
            description: data.post.title,
          });
        } else if (publishError) {
          toast.warning(`Article generated, but CMS publish failed: ${publishError}`, {
            description: data.post.title,
          });
        } else {
          toast.success("Article published to blog", { description: data.post.title });
        }
      }
    } catch {
      toast.error("Network error — try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Panel title="Generate article" className="mt-6">
      {!billingReady ? (
        <div className="h-40 animate-pulse rounded-xl bg-surface" />
      ) : !isPaid ? (
        <FeatureGate
          feature="article_generation"
          title="AI article generation"
          description="Turn citation gaps into publish-ready posts with OpenAI — tailored to your audience, format, and GEO pillar."
          cta="Upgrade to Pilot →"
          highlights={[
            "One-click drafts from your content calendar",
            "Auto-publish to your site blog",
            "Push to WordPress, Webflow, Ghost, and more",
          ]}
        />
      ) : (
        <>
      <p className="mb-4 text-sm text-muted">
        Draft a CitePilot-style post with OpenAI and publish it to the public blog
        automatically. Generation takes 30–90 seconds. New posts appear in the
        article queue below.
      </p>

      {suggestions.length > 0 && (
        <div className="mb-6">
          <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-2">
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Suggested content opportunities (click to pre-fill)
            </span>
            <span className="text-[11px] text-muted">{weekLabel} · refreshes daily</span>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {suggestions.map((s) => (
              <button
                key={`${s.audience}-${s.format}-${s.pillar}-${s.topic}`}
                type="button"
                onClick={() => {
                  setTopic(s.topic);
                  setAngle(s.angle);
                  setContentType(s.format);
                  setPillar(s.pillar);
                  setAudience(s.audience);
                  toast.success("Suggested configuration pre-filled!");
                }}
                className="flex flex-col items-start rounded-xl border border-border bg-white p-3 text-left transition hover:border-accent hover:bg-surface"
                disabled={loading}
              >
                <span className="rounded bg-surface px-1.5 py-0.5 text-[9px] font-bold text-muted uppercase tracking-wide border border-border">
                  {s.badge}
                </span>
                <span className="mt-2 text-xs font-semibold text-ink line-clamp-3 leading-relaxed">
                  {s.topic}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="gen-topic" className="block text-sm font-medium text-ink">
            Topic
          </label>
          <input
            id="gen-topic"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. How to track ChatGPT citations for your brand"
            className="mt-1 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-ink outline-none focus:border-accent"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="gen-angle" className="block text-sm font-medium text-ink">
            Angle <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id="gen-angle"
            type="text"
            value={angle}
            onChange={(e) => setAngle(e.target.value)}
            placeholder="e.g. Focus on free tools and a 7-day checklist"
            className="mt-1 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-ink outline-none focus:border-accent"
            disabled={loading}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="gen-audience" className="block text-sm font-medium text-ink">
              Audience
            </label>
            <select
              id="gen-audience"
              value={audience}
              onChange={(e) => setAudience(e.target.value as AudienceSegment)}
              className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-ink"
              disabled={loading}
            >
              {(Object.keys(AUDIENCE_LABELS) as AudienceSegment[]).map((key) => (
                <option key={key} value={key}>
                  {AUDIENCE_LABELS[key]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="gen-type" className="block text-sm font-medium text-ink">
              Format
            </label>
            <select
              id="gen-type"
              value={contentType}
              onChange={(e) => setContentType(e.target.value as ContentType)}
              className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-ink"
              disabled={loading}
            >
              {(Object.keys(CONTENT_TYPE_LABELS) as ContentType[]).map((key) => (
                <option key={key} value={key}>
                  {CONTENT_TYPE_LABELS[key]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="gen-pillar" className="block text-sm font-medium text-ink">
              Pillar
            </label>
            <select
              id="gen-pillar"
              value={pillar}
              onChange={(e) => setPillar(e.target.value as EditorialPillarId)}
              className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-ink"
              disabled={loading}
            >
              {EDITORIAL_PILLARS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {connectedCms && (
          <div className="flex items-center gap-2.5 rounded-xl border border-border bg-surface/40 p-3.5">
            <input
              id="auto-publish-cms"
              type="checkbox"
              checked={autoPublish}
              onChange={(e) => setAutoPublish(e.target.checked)}
              className="h-4 w-4 rounded border-border text-accent focus:ring-accent accent-ink cursor-pointer"
              disabled={loading}
            />
            <label htmlFor="auto-publish-cms" className="text-sm font-medium text-ink select-none cursor-pointer">
              Automatically publish to connected CMS ({connectedCms.label})
            </label>
          </div>
        )}

        {result && (
          <div className="rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-ink space-y-1.5">
            <p>
              Published locally:{" "}
              <Link
                href={result.post.url}
                className="font-semibold text-accent hover:underline"
                target="_blank"
              >
                {result.post.title}
              </Link>
            </p>
            {result.cmsUrl && (
              <p>
                Published to {connectedCms?.label}:{" "}
                <a
                  href={result.cmsUrl}
                  className="font-semibold text-accent hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View live CMS post →
                </a>
              </p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            publishingToCms ? (
              `Publishing to ${connectedCms?.label}…`
            ) : (
              "Generating & publishing…"
            )
          ) : connectedCms && autoPublish ? (
            `Generate & publish to ${connectedCms.label}`
          ) : (
            "Generate & publish to blog"
          )}
        </button>
      </form>
        </>
      )}
    </Panel>
  );
}
