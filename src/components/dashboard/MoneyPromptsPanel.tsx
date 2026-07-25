"use client";

import { useCallback, useEffect, useState } from "react";
import { Panel } from "@/components/dashboard/DashboardUI";
import { useToast } from "@/components/notifications/ToastProvider";
import { effectInit } from "@/lib/react/effect-init";
import type { CitationGap, MoneyPrompt } from "@/lib/money-prompts/types";
import { dashPrimaryCta } from "@/lib/dashboard/surface-classes";

const scoreColor = (score: number) =>
  score >= 70
    ? "text-emerald-400"
    : score >= 40
      ? "text-amber-400"
      : "text-muted";

const priorityLabel: Record<number, string> = {
  1: "Critical",
  2: "High",
  3: "Medium",
  4: "Low",
  5: "Resolved",
};

export function MoneyPromptsPanel({ workspaceId }: { workspaceId: string }) {
  const toast = useToast();
  const [prompts, setPrompts] = useState<MoneyPrompt[]>([]);
  const [gaps, setGaps] = useState<CitationGap[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [seedText, setSeedText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [promptRes, gapRes] = await Promise.all([
        fetch(
          `/api/money-prompts?workspaceId=${encodeURIComponent(workspaceId)}`,
          { credentials: "include" },
        ),
        fetch(
          `/api/geo-gap?workspaceId=${encodeURIComponent(workspaceId)}&status=open`,
          { credentials: "include" },
        ),
      ]);
      const promptData = (await promptRes.json()) as {
        data?: { prompts?: MoneyPrompt[] };
        error?: string;
      };
      const gapData = (await gapRes.json()) as {
        data?: { gaps?: CitationGap[] };
        error?: string;
      };
      if (!promptRes.ok) {
        throw new Error(promptData.error ?? "Failed to load prompts");
      }
      if (!gapRes.ok) {
        throw new Error(gapData.error ?? "Failed to load gaps");
      }
      setPrompts(promptData.data?.prompts ?? []);
      setGaps(gapData.data?.gaps ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
      setPrompts([]);
      setGaps([]);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    effectInit(() => {
      void load();
    });
  }, [load]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const seeds = seedText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch("/api/money-prompts/generate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          ...(seeds.length ? { seedQueries: seeds } : {}),
          countPerQuery: 4,
        }),
      });
      const data = (await res.json()) as {
        data?: { prompts?: MoneyPrompt[] };
        error?: string;
      };
      if (!res.ok) {
        toast.error(data.error ?? "Generation failed");
        return;
      }
      toast.success(
        `Generated ${data.data?.prompts?.length ?? 0} money prompts`,
      );
      await load();
    } catch {
      toast.error("Network error");
    } finally {
      setGenerating(false);
    }
  }

  async function runCheck(promptId: string) {
    setCheckingId(promptId);
    try {
      const res = await fetch("/api/money-prompts/check", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptId }),
      });
      const data = (await res.json()) as {
        data?: { gapsOpened?: number; prompt?: MoneyPrompt };
        error?: string;
      };
      if (!res.ok) {
        toast.error(data.error ?? "Check failed");
        return;
      }
      toast.success(
        data.data?.gapsOpened
          ? `Checked — ${data.data.gapsOpened} gap(s) opened`
          : "Checked — brand cited on at least one engine",
      );
      await load();
    } catch {
      toast.error("Network error");
    } finally {
      setCheckingId(null);
    }
  }

  async function activatePrompt(promptId: string) {
    setActivatingId(promptId);
    try {
      const res = await fetch(`/api/money-prompts/${promptId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active", addToMonitored: true }),
      });
      const data = (await res.json()) as {
        data?: { monitoredTrimmed?: boolean };
        error?: string;
      };
      if (!res.ok) {
        toast.error(data.error ?? "Could not activate");
        return;
      }
      toast.success(
        data.data?.monitoredTrimmed
          ? "Activated (monitored list trimmed to plan limit)"
          : "Activated and added to monitored prompts",
      );
      await load();
    } catch {
      toast.error("Network error");
    } finally {
      setActivatingId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-40 animate-pulse rounded-2xl bg-white/5" />
        <div className="h-64 animate-pulse rounded-2xl bg-white/5" />
      </div>
    );
  }

  if (error) {
    return (
      <Panel>
        <p className="text-sm text-rose-400">{error}</p>
        <button
          type="button"
          onClick={() => void load()}
          className={`mt-4 ${dashPrimaryCta}`}
        >
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-8">
      <Panel>
        <h2 className="text-lg font-semibold text-ink">Generate</h2>
        <p className="mt-1 text-sm text-muted">
          Optional seed queries (one per line). Leave blank to use monitored
          prompts and your buyer question from Settings.
        </p>
        <textarea
          value={seedText}
          onChange={(e) => setSeedText(e.target.value)}
          rows={4}
          className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-ink placeholder:text-muted"
          placeholder={"best CRM for solo founders\nAI citation tracking tools"}
          aria-label="Seed queries"
        />
        <button
          type="button"
          onClick={() => void handleGenerate()}
          disabled={generating}
          className={`mt-3 ${dashPrimaryCta} disabled:opacity-50`}
        >
          {generating ? "Generating…" : "Generate money prompts"}
        </button>
      </Panel>

      <section>
        <h2 className="mb-1 text-lg font-semibold text-ink">Money Prompts</h2>
        <p className="mb-4 text-sm text-muted">
          Prompts a real buyer would type into ChatGPT, Perplexity, or Gemini
          before purchasing.
        </p>
        <div className="space-y-3">
          {prompts.map((p) => (
            <div
              key={p.id}
              className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">{p.promptText}</p>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted">
                  <span className="uppercase tracking-wide">{p.intent}</span>
                  <span className={scoreColor(p.moneyScore)}>
                    Money score: {p.moneyScore}
                  </span>
                  <span
                    className={
                      p.status === "cited"
                        ? "text-emerald-400"
                        : p.status === "active"
                          ? "text-amber-400"
                          : "text-muted"
                    }
                  >
                    {p.status}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                {p.status === "draft" && (
                  <button
                    type="button"
                    onClick={() => void activatePrompt(p.id)}
                    disabled={activatingId === p.id}
                    className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-ink disabled:opacity-50"
                  >
                    {activatingId === p.id ? "Activating…" : "Activate"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void runCheck(p.id)}
                  disabled={checkingId === p.id}
                  className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-ink disabled:opacity-50"
                >
                  {checkingId === p.id ? "Checking…" : "Check citation"}
                </button>
              </div>
            </div>
          ))}
          {prompts.length === 0 && (
            <p className="text-sm text-muted">
              No money prompts yet — generate some to start tracking.
            </p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-lg font-semibold text-ink">
          Citation Gap Queue
        </h2>
        <p className="mb-4 text-sm text-muted">
          Queries where competitors are cited and you are not — sorted by
          priority.
        </p>
        <div className="space-y-3">
          {[...gaps]
            .sort((a, b) => a.priority - b.priority)
            .map((g) => (
              <div
                key={g.id}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-ink">{g.query}</p>
                  <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-muted">
                    {priorityLabel[g.priority] ?? `P${g.priority}`}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {g.engine} · {g.competitorsCited.length} competitors cited
                  {g.gapReason ? ` · ${g.gapReason}` : ""}
                </p>
                {g.suggestedFix && (
                  <p className="mt-2 text-xs text-ink/80">{g.suggestedFix}</p>
                )}
              </div>
            ))}
          {gaps.length === 0 && (
            <p className="text-sm text-muted">No open gaps — nice work.</p>
          )}
        </div>
      </section>
    </div>
  );
}
