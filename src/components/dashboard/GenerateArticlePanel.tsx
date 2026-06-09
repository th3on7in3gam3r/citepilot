"use client";

import Link from "next/link";
import { useState } from "react";
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

type GenerateResult = {
  post: { slug: string; title: string; url: string };
};

export function GenerateArticlePanel({
  workspaceId,
  onGenerated,
}: {
  workspaceId?: string;
  onGenerated?: () => void;
}) {
  const [topic, setTopic] = useState("");
  const [angle, setAngle] = useState("");
  const [audience, setAudience] = useState<AudienceSegment>("solo-founder");
  const [contentType, setContentType] = useState<ContentType>("tutorial");
  const [pillar, setPillar] = useState<EditorialPillarId>("geo");
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateResult | null>(null);

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
        post?: GenerateResult["post"];
      };
      if (!res.ok) {
        toast.error(data.error ?? "Generation failed");
        return;
      }
      if (data.post) {
        setResult({ post: data.post });
        toast.success("Article published", { description: data.post.title });
        onGenerated?.();
        notifyChecklistUpdate();
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

        {result && (
          <p className="rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-ink">
            Published:{" "}
            <Link
              href={result.post.url}
              className="font-semibold text-accent hover:underline"
              target="_blank"
            >
              {result.post.title}
            </Link>
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Generating & publishing…" : "Generate & publish to blog"}
        </button>
      </form>
    </Panel>
  );
}
