"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { WorkspaceSnapshot } from "@/lib/dashboard";
import {
  dismissGettingStarted,
  gettingStartedCompletion,
  gettingStartedSteps,
  isStepComplete,
  readGettingStartedProgress,
  type GettingStartedProgress,
} from "@/lib/getting-started";

export function GettingStartedChecklist({
  workspace,
  welcome,
}: {
  workspace: WorkspaceSnapshot;
  welcome?: boolean;
}) {
  const [progress, setProgress] = useState<GettingStartedProgress>({});
  const [hasGeneratedPost, setHasGeneratedPost] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const loadProgress = useCallback(() => {
    setProgress(readGettingStartedProgress());
  }, []);

  useEffect(() => {
    loadProgress();
    setHydrated(true);

    void fetch("/api/blog/posts", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { posts: [] }))
      .then((data: { posts?: unknown[] }) =>
        setHasGeneratedPost((data.posts?.length ?? 0) > 0),
      )
      .catch(() => undefined);

  }, [loadProgress]);

  useEffect(() => {
    const onUpdate = () => loadProgress();
    window.addEventListener("storage", onUpdate);
    window.addEventListener("citepilot-checklist-update", onUpdate);
    return () => {
      window.removeEventListener("storage", onUpdate);
      window.removeEventListener("citepilot-checklist-update", onUpdate);
    };
  }, [loadProgress]);

  if (!hydrated || progress.dismissedAt) return null;

  const input = {
    hasDomain: Boolean(workspace.domain?.trim()),
    hasBuyerQuestion: Boolean(workspace.buyerQuestion?.trim()),
    hasRealAudit: workspace.hasRealAudit,
    hasGeneratedPost,
    progress,
  };

  const { completed, total, allDone } = gettingStartedCompletion(input);

  if (allDone) return null;

  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  function handleDismiss() {
    dismissGettingStarted();
    setProgress(readGettingStartedProgress());
  }

  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-accent/25 bg-gradient-to-br from-accent/5 via-white to-white shadow-sm">
      <header className="flex items-start justify-between gap-4 border-b border-accent/10 px-6 py-5">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Getting started
          </p>
          <h2 className="font-display mt-1 text-lg font-bold text-ink">
            {welcome
              ? "Welcome — finish these steps to see citation lift"
              : "Your first-week checklist"}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {completed} of {total} complete · about 15 minutes total
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#6b8cff] to-accent transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="rounded-lg px-2 py-1 text-xs font-medium text-muted hover:bg-surface hover:text-ink"
            aria-expanded={!collapsed}
          >
            {collapsed ? "Show" : "Hide"}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-lg px-2 py-1 text-xs font-medium text-muted hover:bg-surface hover:text-ink"
            title="Dismiss checklist"
          >
            Dismiss
          </button>
        </div>
      </header>

      {!collapsed && (
        <ol className="divide-y divide-border px-2 py-1 sm:px-4">
          {gettingStartedSteps.map((step, index) => {
              const done = isStepComplete(step.id, input);
              return (
                <li key={step.id}>
                  <Link
                    href={step.href}
                    className={`flex items-start gap-4 rounded-xl px-4 py-4 transition hover:bg-surface/80 ${
                      done ? "opacity-70" : ""
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        done
                          ? "bg-mint/15 text-mint"
                          : "bg-accent/10 text-accent"
                      }`}
                      aria-hidden
                    >
                      {done ? "✓" : index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-sm font-semibold ${
                            done ? "text-muted line-through" : "text-ink"
                          }`}
                        >
                          {step.title}
                        </span>
                        {step.optional && (
                          <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                            Optional
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-sm text-muted">
                        {step.description}
                      </span>
                    </span>
                    {!done && (
                      <span className="shrink-0 self-center text-sm font-semibold text-accent">
                        Go →
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
        </ol>
      )}
    </section>
  );
}

export function notifyChecklistUpdate(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("citepilot-checklist-update"));
  }
}
