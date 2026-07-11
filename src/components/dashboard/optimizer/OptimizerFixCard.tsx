"use client";

import Link from "next/link";
import { useState } from "react";
import { buildGenerateArticleHref } from "@/lib/content-studio";
import type { OptimizerFix } from "@/lib/optimizer/types";

const CATEGORY_LABELS: Record<OptimizerFix["category"], string> = {
  seo: "SEO",
  aeo: "AEO",
  llm: "LLM citations",
  robots: "robots.txt",
  prompt: "Money prompt",
};

const CATEGORY_COLORS: Record<OptimizerFix["category"], string> = {
  seo: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  aeo: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  llm: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  robots: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  prompt: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
};

export function OptimizerFixCard({ fix }: { fix: OptimizerFix }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const payload = fix.deliverableType === "code" ? fix.code : fix.prompt;

  async function handleCopy() {
    if (!payload) return;
    await navigator.clipboard.writeText(payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <article className="rounded-xl border border-border bg-white/5 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition hover:bg-white/5"
      >
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">
          {fix.priority}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${CATEGORY_COLORS[fix.category]}`}
            >
              {CATEGORY_LABELS[fix.category]}
            </span>
            <span className="text-[10px] uppercase tracking-wide text-muted">
              {fix.deliverableType === "code" ? "Copy code" : "Copy prompt"}
            </span>
            {fix.source === "ai" && (
              <span className="text-[10px] text-accent/80">AI</span>
            )}
          </div>
          <h3 className="mt-1.5 font-semibold text-ink">{fix.title}</h3>
          <p className="mt-1 text-sm text-muted line-clamp-2">{fix.problem}</p>
        </div>
        <span className="shrink-0 text-muted text-sm">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="border-t border-border px-4 py-4 space-y-3">
          <p className="text-sm text-muted">
            <span className="font-medium text-ink">Where to apply: </span>
            {fix.placement}
          </p>
          {fix.relatedGap && (
            <p className="text-xs text-muted">
              Related gap: <span className="text-ink/80">{fix.relatedGap}</span>
            </p>
          )}
          {payload && (
            <div className="relative">
              <pre className="max-h-72 overflow-auto rounded-lg border border-border bg-[#0f172a] p-3 text-xs text-slate-200 whitespace-pre-wrap">
                {payload}
              </pre>
              <button
                type="button"
                onClick={handleCopy}
                className="absolute right-2 top-2 rounded-md bg-white/10 px-2.5 py-1 text-xs font-medium text-white hover:bg-white/20"
              >
                {copied ? "Copied!" : fix.deliverableType === "code" ? "Copy code" : "Copy prompt"}
              </button>
            </div>
          )}
          {fix.deliverableType === "prompt" && (
            <Link
              href={buildGenerateArticleHref({
                topic: fix.title,
                brief: fix.prompt ?? fix.problem,
              })}
              className="inline-flex text-sm font-semibold text-accent hover:underline"
            >
              Generate article in Content Studio →
            </Link>
          )}
        </div>
      )}
    </article>
  );
}
