"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FeatureGate } from "@/components/billing/FeatureGate";
import { useWorkspaceSwitcher } from "@/contexts/WorkspaceSwitcherContext";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { recordRecentWorkspace, getRecentWorkspaceIds } from "@/lib/workspace/recent";

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

import type { WorkspaceListItem } from "@/hooks/useWorkspace";
import type { WorkspaceLimits } from "@/lib/billing/limits";

function limitsLabel(limits: WorkspaceLimits) {
  if (limits.max == null) {
    return `${limits.count} workspace${limits.count === 1 ? "" : "s"} — Unlimited`;
  }
  return `${limits.count} of ${limits.max} workspaces used`;
}

type WorkspaceSwitcherModalProps = {
  open: boolean;
  onClose: () => void;
};

export function WorkspaceSwitcherModal({ open, onClose }: WorkspaceSwitcherModalProps) {
  const { workspaces, limits, workspace, switchWorkspace } = useWorkspaceContext();
  const { openWizard } = useWorkspaceSwitcher();
  const [query, setQuery] = useState("");
  const [switching, setSwitching] = useState<string | null>(null);

  const activeId = workspace?.workspaceId ?? workspace?.id;

  const sorted = useMemo(() => {
    const recent = getRecentWorkspaceIds();
    const filtered = workspaces.filter((w) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (
        w.domain.toLowerCase().includes(q) ||
        (w.displayName?.toLowerCase().includes(q) ?? false) ||
        w.buyerQuestion.toLowerCase().includes(q)
      );
    });
    return [...filtered].sort((a, b) => {
      const ai = recent.indexOf(a.id);
      const bi = recent.indexOf(b.id);
      if (ai !== -1 || bi !== -1) {
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      }
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  }, [workspaces, query]);

  const handleSwitch = useCallback(
    async (item: WorkspaceListItem) => {
      setSwitching(item.id);
      try {
        await switchWorkspace(item.id);
        recordRecentWorkspace(item.id);
        onClose();
      } finally {
        setSwitching(null);
      }
    },
    [switchWorkspace, onClose],
  );

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-start justify-center bg-black/50 p-4 pt-[8vh] backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Switch workspace"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-border px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold text-ink">Workspaces</h2>
              {limits && (
                <p className="mt-0.5 text-xs text-muted">{limitsLabel(limits)}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-sm text-muted hover:bg-surface hover:text-ink"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search workspaces…"
            className="mt-3 w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-ink outline-none focus:border-accent"
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {sorted.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">No workspaces match your search.</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {sorted.map((item) => {
                const selected = item.id === activeId;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      disabled={switching === item.id}
                      onClick={() => void handleSwitch(item)}
                      className={`flex w-full flex-col rounded-xl border p-4 text-left transition ${
                        selected
                          ? "border-accent bg-accent/5 ring-1 ring-accent/30"
                          : "border-border bg-surface/50 hover:border-accent/40 hover:bg-surface"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-ink">
                            {item.displayName || item.domain}
                          </p>
                          {item.displayName && (
                            <p className="truncate text-xs text-muted">{item.domain}</p>
                          )}
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${
                            item.citationScore >= 70
                              ? "bg-mint/15 text-mint"
                              : item.citationScore >= 40
                                ? "bg-amber-100 text-amber-800"
                                : "bg-surface text-muted"
                          }`}
                        >
                          {item.hasRealAudit ? item.citationScore : "—"}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted">
                        <span>{item.promptCount ?? 0} prompts</span>
                        <span>Scan {formatRelative(item.lastScanAt)}</span>
                        <span
                          className={
                            item.status === "paused"
                              ? "font-semibold text-amber-700"
                              : "text-mint"
                          }
                        >
                          {item.status === "paused" ? "Paused" : "Active"}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-border p-4">
          {limits?.canCreate ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                openWizard();
              }}
              className="w-full rounded-xl bg-ink py-3 text-sm font-semibold text-white hover:bg-ink/90"
            >
              + Add new workspace
            </button>
          ) : limits ? (
            <FeatureGate
              compact
              feature="multi_workspace"
              plan={limits.plan === "pilot" ? "fleet" : "pilot"}
              title={
                limits.plan === "pilot"
                  ? "Workspace limit reached"
                  : "Add another workspace"
              }
              description={
                limits.plan === "pilot"
                  ? `Pilot includes ${limits.max} workspaces. Upgrade to Fleet for unlimited client sites.`
                  : "Upgrade to Pilot for up to 3 workspaces, or Fleet for unlimited."
              }
              cta={limits.plan === "pilot" ? "Upgrade to Fleet →" : "Upgrade to Pilot →"}
              highlights={
                limits.plan === "pilot"
                  ? ["Unlimited workspaces", "Agency overview dashboard", "Bulk scans & exports"]
                  : ["Up to 3 workspaces", "Weekly monitoring", "Email alerts"]
              }
            />
          ) : null}
          <p className="mt-3 text-center text-[11px] text-muted">
            <Link href="/dashboard/workspaces" className="font-semibold text-accent hover:underline">
              Manage all workspaces →
            </Link>
            <span className="mx-2">·</span>
            <kbd className="rounded border border-border px-1.5 py-0.5">⌘⇧W</kbd>
          </p>
        </div>
      </div>
    </div>
  );
}
