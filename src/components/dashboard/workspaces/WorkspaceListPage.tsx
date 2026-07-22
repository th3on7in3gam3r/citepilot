"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useWorkspaceSwitcher } from "@/contexts/WorkspaceSwitcherContext";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import type { WorkspaceListItem } from "@/hooks/useWorkspace";
import { useToast } from "@/components/notifications/ToastProvider";
import { DashboardPageSkeleton } from "@/components/dashboard/layout/DashboardPageSkeleton";

type SortKey = "domain" | "citationScore" | "promptCount" | "lastScanAt" | "status";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 25;

function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "Never";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function compareRows(a: WorkspaceListItem, b: WorkspaceListItem, key: SortKey, dir: SortDir): number {
  let cmp = 0;
  switch (key) {
    case "domain":
      cmp = (a.displayName || a.domain).localeCompare(b.displayName || b.domain);
      break;
    case "citationScore":
      cmp = a.citationScore - b.citationScore;
      break;
    case "promptCount":
      cmp = (a.promptCount ?? 0) - (b.promptCount ?? 0);
      break;
    case "lastScanAt":
      cmp = (a.lastScanAt ?? "").localeCompare(b.lastScanAt ?? "");
      break;
    case "status":
      cmp = (a.status ?? "active").localeCompare(b.status ?? "active");
      break;
  }
  return dir === "asc" ? cmp : -cmp;
}

export function WorkspaceListPage() {
  const { workspaces, ready, refresh, limits, switchWorkspace } = useWorkspaceContext();
  const { openWizard } = useWorkspaceSwitcher();
  const toast = useToast();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("domain");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(0);
  const [bulkBusy, setBulkBusy] = useState(false);

  useEffect(() => {
    if (ready) void refresh();
  }, [ready, refresh]);

  const sorted = useMemo(
    () => [...workspaces].sort((a, b) => compareRows(a, b, sortKey, sortDir)),
    [workspaces, sortKey, sortDir],
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageRows = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(0);
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllOnPage() {
    const ids = pageRows.map((r) => r.id);
    const allSelected = ids.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (allSelected) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  }

  const runBulk = useCallback(
    async (action: "scan" | "archive" | "export") => {
      const ids = [...selected];
      if (ids.length === 0) return;
      setBulkBusy(true);
      try {
        const res = await fetch("/api/workspaces/bulk", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, workspaceIds: ids }),
        });
        const body = (await res.json()) as {
          ok?: boolean;
          archived?: number;
          exports?: { url: string }[];
          results?: { ok: boolean }[];
          error?: string;
        };
        if (!res.ok) {
          toast.error(body.error ?? "Bulk action failed");
          return;
        }
        if (action === "archive") {
          toast.success(`Archived ${body.archived ?? ids.length} workspace(s)`);
          setSelected(new Set());
          await refresh();
        } else if (action === "export" && body.exports) {
          for (const exp of body.exports) window.open(exp.url, "_blank");
          toast.success(`Opened ${body.exports.length} export(s)`);
        } else if (action === "scan") {
          const ok = body.results?.filter((r) => r.ok).length ?? 0;
          toast.success(`Launched ${ok} scan(s)`);
        }
      } finally {
        setBulkBusy(false);
      }
    },
    [selected, refresh, toast],
  );

  if (!ready) return <DashboardPageSkeleton />;

  const headerBtn = (key: SortKey, label: string) => (
    <button
      type="button"
      onClick={() => toggleSort(key)}
      className="inline-flex items-center gap-1 font-semibold hover:text-ink"
    >
      {label}
      {sortKey === key && <span className="text-accent">{sortDir === "asc" ? "↑" : "↓"}</span>}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-ink">Workspaces</h2>
          {limits && (
            <p className="mt-1 text-sm text-muted">
              {limits.max == null
                ? `${limits.count} workspaces — Unlimited`
                : `${limits.count} of ${limits.max} workspaces used`}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={openWizard}
          className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink/90"
        >
          + Add workspace
        </button>
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3">
          <span className="text-sm font-semibold text-ink">{selected.size} selected</span>
          <button
            type="button"
            disabled={bulkBusy}
            onClick={() => void runBulk("scan")}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
          >
            Run scan on selected
          </button>
          <button
            type="button"
            disabled={bulkBusy}
            onClick={() => void runBulk("export")}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
          >
            Export report for selected
          </button>
          <button
            type="button"
            disabled={bulkBusy}
            onClick={() => void runBulk("archive")}
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-50"
          >
            Archive selected
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border bg-surface/50 text-xs text-muted">
            <tr>
              <th className="w-10 px-3 py-3">
                <input
                  type="checkbox"
                  checked={pageRows.length > 0 && pageRows.every((r) => selected.has(r.id))}
                  onChange={toggleAllOnPage}
                  aria-label="Select all on page"
                />
              </th>
              <th className="px-3 py-3">{headerBtn("domain", "Domain")}</th>
              <th className="px-3 py-3">{headerBtn("citationScore", "Citation Score")}</th>
              <th className="px-3 py-3">{headerBtn("promptCount", "Prompts")}</th>
              <th className="px-3 py-3">{headerBtn("lastScanAt", "Last Scan")}</th>
              <th className="px-3 py-3">{headerBtn("status", "Status")}</th>
              <th className="px-3 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <p className="font-display text-base font-bold text-ink">No workspaces yet</p>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
                    Add a client domain to start tracking AI citations.
                  </p>
                  <button
                    type="button"
                    onClick={openWizard}
                    className="mt-4 inline-flex rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-deep"
                  >
                    + Add workspace
                  </button>
                </td>
              </tr>
            )}
            {pageRows.map((row) => (
              <tr key={row.id} className="hover:bg-surface/40">
                <td className="px-3 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(row.id)}
                    onChange={() => toggleSelect(row.id)}
                    aria-label={`Select ${row.domain}`}
                  />
                </td>
                <td className="px-3 py-3">
                  <button
                    type="button"
                    onClick={() => void switchWorkspace(row.id)}
                    className="text-left font-medium text-ink hover:text-accent"
                  >
                    {row.displayName || row.domain}
                  </button>
                  {row.displayName && (
                    <p className="text-xs text-muted">{row.domain}</p>
                  )}
                </td>
                <td className="px-3 py-3 font-semibold">
                  {row.hasRealAudit ? row.citationScore : "—"}
                </td>
                <td className="px-3 py-3">{row.promptCount ?? 0}</td>
                <td className="px-3 py-3 text-muted">{formatRelative(row.lastScanAt)}</td>
                <td className="px-3 py-3">
                  <span
                    className={
                      row.status === "paused"
                        ? "rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800"
                        : "rounded-full bg-mint/15 px-2 py-0.5 text-xs font-semibold text-mint"
                    }
                  >
                    {row.status === "paused" ? "Paused" : "Active"}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap items-center gap-3">
                    {!row.hasRealAudit && (
                      <Link
                        href="/dashboard/geo-audit"
                        onClick={() => void switchWorkspace(row.id)}
                        className="text-xs font-semibold text-accent hover:underline"
                      >
                        Run scan
                      </Link>
                    )}
                    <Link
                      href="/dashboard/settings"
                      onClick={() => void switchWorkspace(row.id)}
                      className="text-xs font-semibold text-muted hover:text-accent hover:underline"
                    >
                      Settings
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sorted.length > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted">
            Page {page + 1} of {totalPages} · {sorted.length} workspaces
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-border px-3 py-1.5 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-border px-3 py-1.5 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
