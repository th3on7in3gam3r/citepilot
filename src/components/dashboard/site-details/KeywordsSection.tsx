"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  PrivacySettingsBlock,
  SiteDetailsFooter,
} from "@/components/dashboard/site-details/SiteDetailsShared";
import {
  DashboardFilterTabs,
} from "@/components/dashboard/layout/DashboardToolbar";
import { DashboardMetricTile } from "@/components/dashboard/layout/DashboardMetricTile";
import {
  DashboardTable,
  DashboardTableBody,
  DashboardTableHead,
  DashboardTableRow,
  DashboardTableTd,
  DashboardTableTh,
} from "@/components/dashboard/layout/DashboardTable";
import { PromptExportMenu } from "@/components/dashboard/prompts/PromptExportMenu";
import { PromptImportModal } from "@/components/dashboard/prompts/PromptImportModal";
import { useToast } from "@/components/notifications/ToastProvider";
import { updateWorkspace } from "@/lib/client/api";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import type { WorkspaceSnapshot } from "@/lib/dashboard";
import {
  buildKeywordRows,
  keywordRankingSummary,
  type KeywordRow,
} from "@/lib/site-details/keyword-data";
import { formatRelativeScanTime } from "@/lib/scans/history-format";

type Tab = "active" | "pending";
type Range = "1d" | "7d" | "30d" | "start";

export function KeywordsSection({
  workspace,
  onContinue,
}: {
  workspace: WorkspaceSnapshot;
  onContinue: () => void;
}) {
  const toast = useToast();
  const { applyWorkspace, refresh } = useWorkspaceContext();
  const [tab, setTab] = useState<Tab>("active");
  const [range, setRange] = useState<Range>("7d");
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");
  const [adding, setAdding] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [rescanning, setRescanning] = useState(false);
  const [scanInProgress, setScanInProgress] = useState(false);
  const [remainingLabel, setRemainingLabel] = useState<string | null>(null);
  const [isPilot, setIsPilot] = useState(false);
  const promptInputRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();

  const workspaceId = workspace.workspaceId ?? workspace.id ?? "";

  useEffect(() => {
    if (searchParams.get("tour") !== "focus-prompt") return;
    setShowAddForm(true);
    const timer = window.setTimeout(() => {
      promptInputRef.current?.focus();
      promptInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchParams]);

  useEffect(() => {
    if (!workspaceId) return;
    void fetch(`/api/workspaces/${workspaceId}/scan`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { inProgress?: boolean; remainingLabel?: string } | null) => {
        setScanInProgress(Boolean(d?.inProgress));
        setRemainingLabel(d?.remainingLabel ?? null);
      })
      .catch(() => undefined);
    void fetch("/api/billing/status", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { plan?: string } | null) =>
        setIsPilot(d?.plan === "pilot" || d?.plan === "fleet"),
      )
      .catch(() => setIsPilot(false));
  }, [workspaceId]);

  async function handleRescanAll() {
    if (!workspaceId || rescanning) return;
    setRescanning(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/scan`, {
        method: "POST",
        credentials: "include",
      });
      const body = (await res.json()) as {
        error?: string;
        remainingLabel?: string;
        inProgress?: boolean;
      };
      if (!res.ok) {
        toast.error(body.error ?? "Re-scan failed");
        if (body.inProgress) setScanInProgress(true);
        return;
      }
      setScanInProgress(true);
      setRemainingLabel(body.remainingLabel ?? null);
      toast.success("Re-scan queued", {
        description: "All prompts in this workspace will be scanned shortly.",
      });
      void refresh();
    } catch {
      toast.error("Re-scan failed");
    } finally {
      setRescanning(false);
    }
  }

  const lastScanIso =
    workspace.citationHistory?.[workspace.citationHistory.length - 1]?.recordedAt ??
    (workspace.hasRealAudit ? workspace.updatedAt : null);
  const lastScanLabel = formatRelativeScanTime(lastScanIso);

  const allRows = useMemo(() => buildKeywordRows(workspace), [workspace]);
  const activeRows = allRows.filter((r) => r.active);
  const pendingRows = allRows.filter((r) => !r.active);
  const rows = tab === "active" ? activeRows : pendingRows;
  const summary = keywordRankingSummary(allRows);

  const displayDomain = workspace.domain
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");

  async function handleAddKeyword(e: React.FormEvent) {
    e.preventDefault();
    const kw = newKeyword.trim();
    if (!kw || !workspaceId) return;

    const existing = workspace.preferences?.monitoredPrompts ?? [];
    if (existing.includes(kw)) {
      toast.error("This keyword is already being tracked.");
      return;
    }

    setAdding(true);
    try {
      const updated = await updateWorkspace(workspaceId, {
        domain: workspace.domain,
        businessType: workspace.businessType,
        description: workspace.description,
        buyerQuestion: workspace.buyerQuestion,
        audiences: workspace.audiences,
        competitors: workspace.competitors,
        referral: "",
        preferences: {
          ...(workspace.preferences ?? {}),
          monitoredPrompts: [...existing, kw],
        },
      });
      if (updated) {
        applyWorkspace(updated, workspaceId);
        toast.success("Keyword added", {
          description: `"${kw}" is now being tracked.`,
        });
        setNewKeyword("");
        setShowAddForm(false);
      } else {
        toast.error("Failed to save keyword.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save keyword.");
    } finally {
      setAdding(false);
    }
  }

  function handleSave(andContinue: boolean) {
    setSaving(true);
    toast.success("Keywords saved", {
      description: `Tracking ${activeRows.length} active and ${pendingRows.length} pending keywords.`,
    });
    setSaving(false);
    if (andContinue) onContinue();
  }

  return (
    <div className="space-y-8">
      <DashboardFilterTabs
        items={[
          { id: "active", label: "Active keywords", count: activeRows.length || allRows.length },
          { id: "pending", label: "Pending keywords", count: pendingRows.length || 0 },
        ]}
        value={tab}
        onChange={setTab}
      />

      <div className="dash-content-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#94a3b8]">Domain</p>
          <p className="mt-1 font-semibold text-[#0f172a]">{displayDomain}</p>
          <p className="mt-2 text-xs text-[#64748b]">
            Last scanned:{" "}
            <span className="font-semibold text-[#0f172a]">
              {scanInProgress ? "Scan in progress…" : lastScanLabel}
            </span>
            {isPilot && remainingLabel && !scanInProgress && (
              <span className="ml-2 text-[#94a3b8]">· {remainingLabel}</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isPilot && (
            <button
              type="button"
              disabled={rescanning || scanInProgress}
              onClick={() => void handleRescanAll()}
              className="rounded-xl border border-[#e2e8f0] bg-white px-4 py-2.5 text-sm font-semibold text-[#0f172a] transition hover:bg-[#f8fafb] disabled:opacity-60"
            >
              {scanInProgress ? "Scanning…" : rescanning ? "Queueing…" : "Re-scan all prompts"}
            </button>
          )}
          <Link
            href="/dashboard/analytics"
            className="rounded-xl border border-[#e2e8f0] bg-white px-4 py-2.5 text-sm font-semibold text-[#0f172a] transition hover:bg-[#f8fafb]"
          >
            View Keyword Rankings
          </Link>
          <PromptExportMenu workspace={workspace} />
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="rounded-xl border border-[#e2e8f0] bg-white px-4 py-2.5 text-sm font-semibold text-[#0f172a] transition hover:bg-[#f8fafb]"
          >
            Import prompts
          </button>
          <button
            type="button"
            data-tour="prompt-input"
            onClick={() => setShowAddForm((v) => !v)}
            className="rounded-xl border border-accent/40 bg-accent/5 px-4 py-2.5 text-sm font-semibold text-accent transition hover:bg-accent/10"
          >
            {showAddForm ? "Cancel" : "+ Add Keyword"}
          </button>
        </div>
      </div>

      {/* Inline add keyword form */}
      {showAddForm && (
        <form
          onSubmit={handleAddKeyword}
          className="flex gap-3 rounded-2xl border border-accent/30 bg-accent/5 p-4"
        >
          <input
            ref={promptInputRef}
            type="text"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            placeholder="Enter a buyer question or keyword to track…"
            className="min-w-0 flex-1 rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            autoFocus
            required
          />
          <button
            type="submit"
            disabled={adding || !newKeyword.trim()}
            className="shrink-0 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-deep disabled:opacity-60"
          >
            {adding ? "Saving…" : "Add"}
          </button>
        </form>
      )}

      {/* Empty state for active tab */}
      {tab === "active" && activeRows.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
          <p className="font-display text-lg font-bold text-ink">No active keywords yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            Add a buyer question above, or run a citation audit to populate keywords from your money prompts.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-deep"
            >
              + Add keyword
            </button>
            <Link
              href="/dashboard/settings"
              className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-surface"
            >
              Configure in Settings
            </Link>
          </div>
        </div>
      )}

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-ink">Keyword ranking</h3>
          <DashboardFilterTabs
            items={[
              { id: "1d", label: "1d" },
              { id: "7d", label: "7d" },
              { id: "30d", label: "30d" },
              { id: "start", label: "Start" },
            ]}
            value={range}
            onChange={setRange}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <DashboardMetricTile
            label="Keywords up"
            value={String(summary.up)}
            delta={`${summary.up} since start`}
            theme="emerald"
          />
          <DashboardMetricTile
            label="In top 3"
            value={String(summary.top3)}
            delta={`${summary.top3} since start`}
            theme="sky"
          />
          <DashboardMetricTile
            label="In top 20"
            value={summary.top20 > 0 ? String(summary.top20) : "—"}
            delta={summary.top20 > 0 ? `${summary.top20} since start` : "—"}
            theme="violet"
          />
          <DashboardMetricTile
            label="In top 30"
            value={summary.top30 > 0 ? String(summary.top30) : "—"}
            delta={summary.top30 > 0 ? `${summary.top30} since start` : "—"}
            theme="neutral"
          />
          <DashboardMetricTile
            label="In top 100"
            value={`${summary.top100}/${summary.total || 1}`}
            delta={`${summary.top100} since start`}
            theme="rose"
          />
        </div>
      </section>

      <DashboardTable minWidth="720px">
        <DashboardTableHead>
          <DashboardTableRow header>
            <DashboardTableTh>Keyword / URL</DashboardTableTh>
            <DashboardTableTh>Category</DashboardTableTh>
            <DashboardTableTh>Rank</DashboardTableTh>
            <DashboardTableTh>7d</DashboardTableTh>
            <DashboardTableTh>30d</DashboardTableTh>
            <DashboardTableTh>Life</DashboardTableTh>
          </DashboardTableRow>
        </DashboardTableHead>
        <DashboardTableBody>
          {rows.map((row) => (
            <KeywordTableRow key={row.id} row={row} />
          ))}
          {rows.length === 0 && tab === "pending" && (
            <DashboardTableRow>
              <DashboardTableTd colSpan={6} className="py-10 text-center text-muted">
                No pending keywords. All tracked keywords are active.
              </DashboardTableTd>
            </DashboardTableRow>
          )}
        </DashboardTableBody>
      </DashboardTable>

      <PrivacySettingsBlock />

      <SiteDetailsFooter
        saving={saving}
        onSave={() => handleSave(false)}
        onSaveContinue={() => handleSave(true)}
      />

      <PromptImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        workspaceId={workspaceId}
        domain={displayDomain}
        existingPrompts={workspace.preferences?.monitoredPrompts ?? []}
        onImported={() => {
          void refresh();
        }}
      />
    </div>
  );
}

function KeywordTableRow({ row }: { row: KeywordRow }) {
  return (
    <DashboardTableRow>
      <DashboardTableTd>
        <p className="font-semibold text-ink">{row.keyword}</p>
        <p className="mt-0.5 truncate text-xs text-accent">{row.url}</p>
      </DashboardTableTd>
      <DashboardTableTd className="text-muted">{row.category}</DashboardTableTd>
      <DashboardTableTd className="font-semibold text-ink">{row.rank}</DashboardTableTd>
      <DashboardTableTd>
        <TrendBadge value={row.trend7d} />
      </DashboardTableTd>
      <DashboardTableTd>
        <TrendBadge value={row.trend30d} />
      </DashboardTableTd>
      <DashboardTableTd>
        <TrendBadge value={row.trendLife} />
      </DashboardTableTd>
    </DashboardTableRow>
  );
}

function TrendBadge({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
        positive ? "text-[#0284c7]" : "text-[#64748b]"
      }`}
    >
      {positive ? "↑" : "↓"}
      {positive ? `+${value}` : value}
    </span>
  );
}
