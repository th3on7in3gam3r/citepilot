"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { WorkspaceSnapshot } from "@/lib/dashboard";
import {
  gettingStartedCompletion,
  gettingStartedSteps,
  isStepComplete,
  type ChecklistCompletion,
} from "@/lib/getting-started";
import { effectInit } from "@/lib/react/effect-init";

type ChecklistApi = {
  startedAt: string;
  dismissedAt: string | null;
  completion: ChecklistCompletion;
  allDone: boolean;
  shouldShow: boolean;
};

export function GettingStartedChecklist({
  workspace,
}: {
  workspace: WorkspaceSnapshot;
  welcome?: boolean;
}) {
  const workspaceId = workspace.workspaceId ?? workspace.id;
  const [data, setData] = useState<ChecklistApi | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const load = useCallback(() => {
    if (!workspaceId) return;
    void fetch(`/api/onboarding/checklist?workspaceId=${encodeURIComponent(workspaceId)}`, {
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((json: ChecklistApi | null) => setData(json))
      .catch(() => undefined);
  }, [workspaceId]);

  useEffect(() => {
    effectInit(() => {
      setHydrated(true);
      load();
    });
  }, [load]);

  useEffect(() => {
    const onUpdate = () => load();
    window.addEventListener("citepilot-checklist-update", onUpdate);
    return () => window.removeEventListener("citepilot-checklist-update", onUpdate);
  }, [load]);

  if (!hydrated || !data?.shouldShow) return null;

  const { completed, total } = gettingStartedCompletion(data.completion);
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  async function handleDismiss() {
    await fetch("/api/onboarding/checklist", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "dismiss" }),
    });
    load();
  }

  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-accent/25 bg-gradient-to-br from-accent/5 via-card to-card shadow-sm dark:from-accent/10 dark:via-[#111] dark:to-[#111] dark:border-accent/20">
      <header className="flex items-start justify-between gap-4 border-b border-accent/10 px-6 py-5">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Getting started
          </p>
          <h2 className="font-display mt-1 text-lg font-bold text-ink">
            Your first-week checklist
          </h2>
          <p className="mt-1 text-sm text-muted">
            {completed} of {total} complete
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
            onClick={() => void handleDismiss()}
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
            const done = isStepComplete(step.id, data.completion);
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
                      done ? "bg-mint/15 text-mint" : "bg-accent/10 text-accent"
                    }`}
                    aria-hidden
                  >
                    {done ? "✓" : "☐"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block text-sm font-semibold ${
                        done ? "text-muted line-through" : "text-ink"
                      }`}
                    >
                      {step.title}
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
