"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  PrivacySettingsBlock,
  SiteDetailsFooter,
} from "@/components/dashboard/site-details/SiteDetailsShared";
import { useToast } from "@/components/notifications/ToastProvider";
import { updateWorkspace } from "@/lib/client/api";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import type { WorkspaceSnapshot } from "@/lib/dashboard";
import {
  buildKeywordRows,
  keywordRankingSummary,
  type KeywordRow,
} from "@/lib/site-details/keyword-data";

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
  const { applyWorkspace } = useWorkspaceContext();
  const [tab, setTab] = useState<Tab>("active");
  const [range, setRange] = useState<Range>("7d");
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");
  const [adding, setAdding] = useState(false);

  const allRows = useMemo(() => buildKeywordRows(workspace), [workspace]);
  const activeRows = allRows.filter((r) => r.active);
  const pendingRows = allRows.filter((r) => !r.active);
  const rows = tab === "active" ? activeRows : pendingRows;
  const summary = keywordRankingSummary(allRows);

  const workspaceId = workspace.workspaceId ?? workspace.id ?? "";

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
      <div className="flex flex-wrap items-center justify-center gap-2 rounded-xl bg-[#f8fafb] p-1">
        <TabButton
          active={tab === "active"}
          onClick={() => setTab("active")}
          label={`Active Keywords (${activeRows.length || allRows.length})`}
        />
        <TabButton
          active={tab === "pending"}
          onClick={() => setTab("pending")}
          label={`Pending Keywords (${pendingRows.length || 0})`}
        />
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-[#e8edf3] bg-[#f8fafb]/60 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#94a3b8]">Domain</p>
          <p className="mt-1 font-semibold text-[#0f172a]">{displayDomain}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/analytics"
            className="rounded-xl border border-[#e2e8f0] bg-white px-4 py-2.5 text-sm font-semibold text-[#0f172a] transition hover:bg-[#f8fafb]"
          >
            View Keyword Rankings
          </Link>
          <button
            type="button"
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
          <h3 className="text-sm font-semibold text-[#0f172a]">Keyword Ranking</h3>
          <div className="flex gap-1 rounded-lg bg-[#f1f5f9] p-1 text-xs font-semibold">
            {(["1d", "7d", "30d", "start"] as Range[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`rounded-md px-2.5 py-1 capitalize transition ${
                  range === r
                    ? "bg-white text-[#0f172a] shadow-sm"
                    : "text-[#64748b] hover:text-[#0f172a]"
                }`}
              >
                {r === "start" ? "Start" : r}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <SummaryCard label="Keywords Up" value={String(summary.up)} delta={`${summary.up} Since start`} />
          <SummaryCard label="In Top 3" value={String(summary.top3)} delta={`${summary.top3} Since start`} />
          <SummaryCard
            label="In Top 20"
            value={summary.top20 > 0 ? String(summary.top20) : "—"}
            delta={summary.top20 > 0 ? `${summary.top20} Since start` : "— Since start"}
          />
          <SummaryCard
            label="In Top 30"
            value={summary.top30 > 0 ? String(summary.top30) : "—"}
            delta={summary.top30 > 0 ? `${summary.top30} Since start` : "— Since start"}
          />
          <SummaryCard
            label="In Top 100"
            value={`${summary.top100}/${summary.total || 1}`}
            delta={`${summary.top100} Since start`}
          />
        </div>
      </section>

      <div className="overflow-hidden rounded-2xl border border-[#e8edf3]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#eef2f6] bg-[#f8fafb] text-xs font-semibold text-[#64748b]">
                <th className="px-4 py-3">Keyword / URL</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">7d</th>
                <th className="px-4 py-3">30d</th>
                <th className="px-4 py-3">Life</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f8fafb]">
              {rows.map((row) => (
                <KeywordTableRow key={row.id} row={row} />
              ))}
              {rows.length === 0 && tab === "pending" && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-[#64748b]">
                    No pending keywords. All tracked keywords are active.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PrivacySettingsBlock />

      <SiteDetailsFooter
        saving={saving}
        onSave={() => handleSave(false)}
        onSaveContinue={() => handleSave(true)}
      />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
        active
          ? "bg-white text-[#0f172a] shadow-sm"
          : "text-[#64748b] hover:text-[#0f172a]"
      }`}
    >
      {label}
    </button>
  );
}

function SummaryCard({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta: string;
}) {
  return (
    <div className="rounded-xl border border-[#e8edf3] bg-white px-4 py-4">
      <p className="text-xs text-[#64748b]">{label}</p>
      <p className="mt-1 text-2xl font-bold text-[#0f172a]">{value}</p>
      <p className="mt-1 text-xs text-[#94a3b8]">{delta}</p>
    </div>
  );
}

function KeywordTableRow({ row }: { row: KeywordRow }) {
  return (
    <tr className="hover:bg-[#f8fafb]/80">
      <td className="px-4 py-3.5">
        <p className="font-semibold text-[#0f172a]">{row.keyword}</p>
        <p className="mt-0.5 truncate text-xs text-[#0ea5e9]">{row.url}</p>
      </td>
      <td className="px-4 py-3.5 text-[#64748b]">{row.category}</td>
      <td className="px-4 py-3.5 font-semibold text-[#0f172a]">{row.rank}</td>
      <td className="px-4 py-3.5">
        <TrendBadge value={row.trend7d} />
      </td>
      <td className="px-4 py-3.5">
        <TrendBadge value={row.trend30d} />
      </td>
      <td className="px-4 py-3.5">
        <TrendBadge value={row.trendLife} />
      </td>
    </tr>
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
