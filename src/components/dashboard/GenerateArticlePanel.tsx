"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { notifyChecklistUpdate } from "@/components/dashboard/GettingStartedChecklist";
import { Panel } from "@/components/dashboard/DashboardUI";
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
import { buildContentCalendar, buildMoneyPromptIdeas } from "@/lib/dashboard-data";

type GenerateResult = {
  post: { slug: string; title: string; url: string };
  cmsUrl?: string | null;
};

function mapBusinessTypeToAudience(businessType: string): AudienceSegment {
  const normalized = businessType.toLowerCase();
  if (normalized.includes("saas")) return "saas";
  if (normalized.includes("ecommerce") || normalized.includes("shop")) return "ecommerce";
  if (normalized.includes("agency")) return "agency";
  if (normalized.includes("founder") || normalized.includes("solo")) return "solo-founder";
  return "growth-marketing";
}

export function GenerateArticlePanel({
  workspaceId,
  workspace,
  onGenerated,
}: {
  workspaceId?: string;
  workspace?: WorkspaceSnapshot;
  onGenerated?: () => void;
}) {
  const [topic, setTopic] = useState("");
  const [angle, setAngle] = useState("");
  const [audience, setAudience] = useState<AudienceSegment>("solo-founder");
  const [contentType, setContentType] = useState<ContentType>("tutorial");
  const [pillar, setPillar] = useState<EditorialPillarId>("geo");
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [publishingToCms, setPublishingToCms] = useState(false);
  const [result, setResult] = useState<GenerateResult | null>(null);

  const [connectedCms, setConnectedCms] = useState<{ provider: string; label: string } | null>(null);
  const [autoPublish, setAutoPublish] = useState(true);

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
              ghost: "Ghost",
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

  // Extract suggestions from Content Calendar and Money Prompts
  const suggestions = useMemo(() => {
    if (!workspace) return [];

    const calendar = buildContentCalendar(workspace);
    const moneyPrompts = buildMoneyPromptIdeas(workspace);

    const list: Array<{
      topic: string;
      intent: string;
      format: ContentType;
      pillar: EditorialPillarId;
      angle: string;
      badge: string;
    }> = [];

    calendar.forEach((item) => {
      let format: ContentType = "tutorial";
      if (item.format.toLowerCase().includes("pillar")) format = "pillar";
      if (item.format.toLowerCase().includes("comparison")) format = "comparison";

      list.push({
        topic: item.topic,
        intent: item.format,
        format,
        pillar: "geo",
        angle: `Target focus: ${item.rationale}`,
        badge: `Calendar: ${item.format}`,
      });
    });

    moneyPrompts.forEach((item) => {
      let format: ContentType = "tutorial";
      if (item.intent === "comparison" || item.intent === "alternatives") {
        format = "comparison";
      }

      list.push({
        topic: item.prompt,
        intent: item.intent,
        format,
        pillar: "geo",
        angle: `Target intent: ${item.intent}. ${item.reason}`,
        badge: `Money Prompt: ${item.intent}`,
      });
    });

    const seen = new Set<string>();
    return list.filter((item) => {
      if (seen.has(item.topic.toLowerCase())) return false;
      seen.add(item.topic.toLowerCase());
      return true;
    }).slice(0, 5);
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
        toast.error(data.error ?? "Generation failed");
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
      <p className="mb-4 text-sm text-muted">
        Draft a CitePilot-style post with OpenAI and publish it to the public blog
        automatically. Generation takes 30–90 seconds. New posts appear in the
        article queue below.
      </p>

      {suggestions.length > 0 && (
        <div className="mb-6">
          <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
            Suggested content opportunities (click to pre-fill)
          </span>
          <div className="flex flex-wrap gap-2.5">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setTopic(s.topic);
                  setAngle(s.angle);
                  setContentType(s.format);
                  setPillar(s.pillar);
                  if (workspace?.businessType) {
                    setAudience(mapBusinessTypeToAudience(workspace.businessType));
                  }
                  toast.success("Suggested configuration pre-filled!");
                }}
                className="flex flex-col items-start rounded-xl border border-border bg-white p-3 text-left transition hover:border-accent hover:bg-surface max-w-[240px]"
                disabled={loading}
              >
                <span className="rounded bg-surface px-1.5 py-0.5 text-[9px] font-bold text-muted uppercase tracking-wide border border-border">
                  {s.badge}
                </span>
                <span className="mt-2 text-xs font-semibold text-ink line-clamp-2 leading-relaxed">
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
    </Panel>
  );
}
