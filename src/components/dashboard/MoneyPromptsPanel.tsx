"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Panel } from "@/components/dashboard/DashboardUI";
import { useToast } from "@/components/notifications/ToastProvider";
import { effectInit } from "@/lib/react/effect-init";
import type { CitationGap, MoneyPrompt } from "@/lib/money-prompts/types";
import { dashPrimaryCta } from "@/lib/dashboard/surface-classes";
import { updateWorkspace } from "@/lib/client/api";

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

type WizardStep = "url" | "prompts" | "results" | "fillers";

const STEPS: { id: WizardStep; label: string }[] = [
  { id: "url", label: "URL" },
  { id: "prompts", label: "Prompts" },
  { id: "results", label: "Check" },
  { id: "fillers", label: "Fillers" },
];

export function MoneyPromptsPanel({
  workspaceId,
  workspaceDomain = "",
}: {
  workspaceId: string;
  workspaceDomain?: string;
}) {
  const toast = useToast();
  const [prompts, setPrompts] = useState<MoneyPrompt[]>([]);
  const [gaps, setGaps] = useState<CitationGap[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [seedText, setSeedText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const [step, setStep] = useState<WizardStep>("url");
  const [urlInput, setUrlInput] = useState(workspaceDomain);
  const [wizardBusy, setWizardBusy] = useState(false);
  const [draftPrompts, setDraftPrompts] = useState<MoneyPrompt[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editedTexts, setEditedTexts] = useState<Record<string, string>>({});
  const [draftingGapId, setDraftingGapId] = useState<string | null>(null);

  useEffect(() => {
    if (workspaceDomain && !urlInput) {
      setUrlInput(workspaceDomain);
    }
  }, [workspaceDomain, urlInput]);

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

  function startWizard() {
    setStep("url");
    setUrlInput(workspaceDomain || urlInput);
  }

  async function handleUrlContinue() {
    const clean = urlInput
      .trim()
      .replace(/^https?:\/\//i, "")
      .replace(/\/.*$/, "")
      .toLowerCase();
    if (!clean) {
      toast.error("Enter a site URL or domain");
      return;
    }
    setWizardBusy(true);
    try {
      if (clean !== workspaceDomain.toLowerCase()) {
        await updateWorkspace(workspaceId, { domain: clean });
      }
      setUrlInput(clean);
      setStep("prompts");
      await handleWizardGenerate(clean);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save URL");
    } finally {
      setWizardBusy(false);
    }
  }

  async function handleWizardGenerate(domainOverride?: string) {
    setWizardBusy(true);
    try {
      const res = await fetch("/api/money-prompts/run-flow", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          generate: true,
          check: false,
          activate: false,
          domain: domainOverride ?? urlInput,
          countPerQuery: 3,
        }),
      });
      const data = (await res.json()) as {
        data?: { prompts?: MoneyPrompt[]; generatedCount?: number };
        error?: string;
      };
      if (!res.ok) {
        toast.error(data.error ?? "Generation failed");
        return;
      }
      const all = data.data?.prompts ?? [];
      const drafts = all.filter((p) => p.status === "draft").slice(0, 12);
      const useDrafts = drafts.length ? drafts : all.slice(0, 12);
      setDraftPrompts(useDrafts);
      setSelectedIds(new Set(useDrafts.map((p) => p.id)));
      setEditedTexts(
        Object.fromEntries(useDrafts.map((p) => [p.id, p.promptText])),
      );
      toast.success(
        `Generated ${data.data?.generatedCount ?? useDrafts.length} buyer prompts — edit and approve`,
      );
      await load();
    } catch {
      toast.error("Network error");
    } finally {
      setWizardBusy(false);
    }
  }

  async function handleApproveAndCheck() {
    const ids = [...selectedIds];
    if (!ids.length) {
      toast.error("Select at least one prompt");
      return;
    }
    setWizardBusy(true);
    try {
      const res = await fetch("/api/money-prompts/run-flow", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          generate: false,
          check: true,
          activate: true,
          promptIds: ids,
        }),
      });
      const data = (await res.json()) as {
        data?: {
          prompts?: MoneyPrompt[];
          gaps?: CitationGap[];
          checkedCount?: number;
          gapsOpened?: number;
          checkErrors?: string[];
        };
        error?: string;
      };
      if (!res.ok) {
        toast.error(data.error ?? "Check failed");
        return;
      }
      if (data.data?.prompts) setPrompts(data.data.prompts);
      if (data.data?.gaps) setGaps(data.data.gaps);
      if (data.data?.checkErrors?.length) {
        toast.error(data.data.checkErrors[0]!);
      } else {
        toast.success(
          `Checked ${data.data?.checkedCount ?? 0} — ${data.data?.gapsOpened ?? 0} gap(s) opened`,
        );
      }
      setStep("results");
      await load();
    } catch {
      toast.error("Network error");
    } finally {
      setWizardBusy(false);
    }
  }

  async function handleDraftFiller(gapId: string) {
    setDraftingGapId(gapId);
    try {
      const res = await fetch("/api/money-prompts/draft-filler", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, gapId }),
      });
      const data = (await res.json()) as {
        data?: { title?: string; postSlug?: string; contentStudioUrl?: string };
        error?: string;
      };
      if (!res.ok) {
        toast.error(data.error ?? "Draft failed");
        return;
      }
      toast.success(`Drafted “${data.data?.title ?? "article"}” — open Content Studio`);
      setGaps((prev) => prev.filter((g) => g.id !== gapId));
      setStep("fillers");
    } catch {
      toast.error("Network error");
    } finally {
      setDraftingGapId(null);
    }
  }

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

  const cited = prompts.filter((p) => p.status === "cited");
  const notCited = prompts.filter(
    (p) => p.status === "active" || p.status === "draft",
  );
  const stepIndex = STEPS.findIndex((s) => s.id === step);

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
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-ink">Guided loop</h2>
            <p className="mt-1 text-sm text-muted">
              Enter your site → we invent buyer prompts → we find where rivals
              get cited → we draft pages that fill those gaps.
            </p>
          </div>
          {prompts.length === 0 && step === "url" && (
            <button
              type="button"
              onClick={startWizard}
              className={dashPrimaryCta}
            >
              Start with your URL
            </button>
          )}
        </div>

        <ol className="mt-4 flex flex-wrap gap-2" aria-label="Wizard steps">
          {STEPS.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => setStep(s.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  s.id === step
                    ? "bg-accent text-white"
                    : i < stepIndex
                      ? "bg-white/10 text-ink"
                      : "bg-white/5 text-muted"
                }`}
              >
                {i + 1}. {s.label}
              </button>
            </li>
          ))}
        </ol>

        {step === "url" && (
          <div className="mt-6 space-y-3">
            <label htmlFor="money-prompt-url" className="block text-sm text-ink">
              Your site URL
            </label>
            <input
              id="money-prompt-url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="getcitepilot.com"
              className="w-full max-w-lg rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-ink"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={wizardBusy}
                onClick={() => void handleUrlContinue()}
                className={`${dashPrimaryCta} disabled:opacity-50`}
              >
                {wizardBusy ? "Working…" : "Continue — generate prompts"}
              </button>
              {workspaceDomain && (
                <button
                  type="button"
                  className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-ink"
                  onClick={() => setUrlInput(workspaceDomain)}
                >
                  Use workspace URL
                </button>
              )}
            </div>
          </div>
        )}

        {step === "prompts" && (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-muted">
              Deselect any you don’t want. Then approve to activate and check
              citations.
            </p>
            {wizardBusy && draftPrompts.length === 0 && (
              <p className="text-sm text-muted">Generating buyer prompts…</p>
            )}
            <div className="space-y-2">
              {draftPrompts.map((p) => {
                const selected = selectedIds.has(p.id);
                return (
                  <label
                    key={p.id}
                    className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3"
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => {
                        setSelectedIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(p.id)) next.delete(p.id);
                          else next.add(p.id);
                          return next;
                        });
                      }}
                      className="mt-1"
                    />
                    <div className="min-w-0 flex-1">
                      <textarea
                        value={editedTexts[p.id] ?? p.promptText}
                        onChange={(e) =>
                          setEditedTexts((prev) => ({
                            ...prev,
                            [p.id]: e.target.value,
                          }))
                        }
                        rows={2}
                        className="w-full rounded-lg border border-white/10 bg-transparent px-2 py-1 text-sm text-ink"
                        aria-label="Edit money prompt"
                      />
                      <p className="mt-1 text-xs text-muted">
                        {p.intent} · score {p.moneyScore}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={wizardBusy || selectedIds.size === 0}
                onClick={() => void handleApproveAndCheck()}
                className={`${dashPrimaryCta} disabled:opacity-50`}
              >
                {wizardBusy ? "Checking…" : "Approve & check citations"}
              </button>
              <button
                type="button"
                disabled={wizardBusy}
                onClick={() => void handleWizardGenerate()}
                className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-ink disabled:opacity-50"
              >
                Regenerate
              </button>
            </div>
          </div>
        )}

        {step === "results" && (
          <div className="mt-6 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <p className="text-xs uppercase text-muted">Cited</p>
                <p className="text-2xl font-semibold text-emerald-400">
                  {cited.length}
                </p>
              </div>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <p className="text-xs uppercase text-muted">Not cited / open</p>
                <p className="text-2xl font-semibold text-amber-400">
                  {notCited.length}
                </p>
              </div>
            </div>
            <p className="text-sm text-muted">
              {gaps.length
                ? `${gaps.length} open citation gap(s) — draft filler articles next.`
                : "No open gaps from this check. Re-run or add more prompts."}
            </p>
            <button
              type="button"
              onClick={() => setStep("fillers")}
              className={dashPrimaryCta}
            >
              Go to fillers
            </button>
          </div>
        )}

        {step === "fillers" && (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-muted">
              One-click drafts land in Content Studio — edit and publish when
              ready.
            </p>
            {[...gaps]
              .sort((a, b) => a.priority - b.priority)
              .map((g) => (
                <div
                  key={g.id}
                  className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">{g.query}</p>
                    <p className="mt-1 text-xs text-muted">
                      {priorityLabel[g.priority]} · {g.engine}
                      {g.gapReason ? ` · ${g.gapReason}` : ""}
                    </p>
                    {g.suggestedFix && (
                      <p className="mt-2 text-xs text-ink/80">{g.suggestedFix}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={draftingGapId === g.id}
                    onClick={() => void handleDraftFiller(g.id)}
                    className="shrink-0 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-ink disabled:opacity-50"
                  >
                    {draftingGapId === g.id
                      ? "Drafting…"
                      : "Draft filler article"}
                  </button>
                </div>
              ))}
            {gaps.length === 0 && (
              <p className="text-sm text-muted">
                No open gaps.{" "}
                <Link href="/dashboard/content" className="text-accent underline">
                  Open Content Studio
                </Link>
              </p>
            )}
            {gaps.length > 0 && (
              <Link
                href="/dashboard/content"
                className="inline-block text-sm text-accent underline"
              >
                Open Content Studio →
              </Link>
            )}
          </div>
        )}
      </Panel>

      <div>
        <button
          type="button"
          onClick={() => setAdvancedOpen((o) => !o)}
          className="text-sm font-medium text-muted hover:text-ink"
          aria-expanded={advancedOpen}
        >
          {advancedOpen ? "Hide advanced" : "Show advanced"}
        </button>
      </div>

      {advancedOpen && (
        <div className="space-y-8">
          <Panel>
            <h2 className="text-lg font-semibold text-ink">Generate</h2>
            <p className="mt-1 text-sm text-muted">
              Optional seed queries (one per line). Leave blank to use domain,
              description, buyer question, and monitored prompts.
            </p>
            <textarea
              value={seedText}
              onChange={(e) => setSeedText(e.target.value)}
              rows={4}
              className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-ink placeholder:text-muted"
              placeholder={
                "best CRM for solo founders\nAI citation tracking tools"
              }
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
            <h2 className="mb-1 text-lg font-semibold text-ink">
              Money Prompts
            </h2>
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
                  No money prompts yet — use the guided loop above or generate
                  here.
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
                    <button
                      type="button"
                      disabled={draftingGapId === g.id}
                      onClick={() => void handleDraftFiller(g.id)}
                      className="mt-3 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-ink disabled:opacity-50"
                    >
                      {draftingGapId === g.id
                        ? "Drafting…"
                        : "Draft filler article"}
                    </button>
                  </div>
                ))}
              {gaps.length === 0 && (
                <p className="text-sm text-muted">No open gaps — nice work.</p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
