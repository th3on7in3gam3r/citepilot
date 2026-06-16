"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useWorkspaceSwitcher } from "@/contexts/WorkspaceSwitcherContext";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { useToast } from "@/components/notifications/ToastProvider";
import { DashboardPageSkeleton } from "@/components/dashboard/layout/DashboardPageSkeleton";

type AgencyOverview = {
  workspaceCount: number;
  weightedCitationScore: number;
  needsAttention: {
    id: string;
    domain: string;
    displayName: string | null;
    citationScore: number;
    scoreDeltaWeek: number;
  }[];
  recentActivity: {
    id: string;
    workspaceId: string;
    domain: string;
    score: number;
    createdAt: string;
  }[];
};

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function FleetAgencyOverview() {
  const { switchWorkspace } = useWorkspaceContext();
  const { openWizard } = useWorkspaceSwitcher();
  const toast = useToast();
  const [data, setData] = useState<AgencyOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [bulkBusy, setBulkBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/workspaces/agency-overview", { credentials: "include" });
    if (!res.ok) {
      setData(null);
      return;
    }
    setData((await res.json()) as AgencyOverview);
  }, []);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  async function runBulk(action: "scan" | "export") {
    if (!data) return;
    const listRes = await fetch("/api/workspaces", { credentials: "include" });
    if (!listRes.ok) return;
    const list = (await listRes.json()) as { workspaces: { id: string }[] };
    const ids = list.workspaces.map((w) => w.id);
    if (ids.length === 0) return;

    setBulkBusy(action);
    try {
      const res = await fetch("/api/workspaces/bulk", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, workspaceIds: ids }),
      });
      const body = (await res.json()) as {
        ok?: boolean;
        exports?: { workspaceId: string; url: string }[];
        results?: { ok: boolean }[];
      };
      if (!res.ok) {
        toast.error("Bulk action failed");
        return;
      }
      if (action === "export" && body.exports) {
        for (const exp of body.exports) {
          window.open(exp.url, "_blank");
        }
        toast.success(`Opened ${body.exports.length} export${body.exports.length === 1 ? "" : "s"}`);
      } else if (action === "scan") {
        const ok = body.results?.filter((r) => r.ok).length ?? 0;
        toast.success(`Launched scans for ${ok} workspace${ok === 1 ? "" : "s"}`);
        void load();
      }
    } finally {
      setBulkBusy(null);
    }
  }

  if (loading) return <DashboardPageSkeleton />;

  if (!data) {
    return (
      <p className="text-sm text-muted">Unable to load agency overview.</p>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Agency overview</p>
          <h2 className="font-display mt-1 text-2xl font-bold text-ink">
            {data.workspaceCount} client workspace{data.workspaceCount === 1 ? "" : "s"}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={bulkBusy === "scan"}
            onClick={() => void runBulk("scan")}
            className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-ink hover:bg-surface disabled:opacity-50"
          >
            {bulkBusy === "scan" ? "Running…" : "Run all scans"}
          </button>
          <button
            type="button"
            disabled={bulkBusy === "export"}
            onClick={() => void runBulk("export")}
            className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-ink hover:bg-surface disabled:opacity-50"
          >
            {bulkBusy === "export" ? "Exporting…" : "Export all reports"}
          </button>
          <button
            type="button"
            onClick={openWizard}
            className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink/90"
          >
            + Add workspace
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold text-muted">Weighted citation score</p>
          <p className="font-display mt-2 text-4xl font-bold text-ink">
            {data.weightedCitationScore}
          </p>
          <p className="mt-1 text-xs text-muted">Average across audited workspaces</p>
        </div>
        <Link
          href="/dashboard/workspaces"
          className="rounded-2xl border border-border bg-card p-5 transition hover:border-accent/40"
        >
          <p className="text-xs font-semibold text-muted">Manage workspaces</p>
          <p className="mt-2 text-sm font-semibold text-accent">View full list →</p>
        </Link>
      </div>

      {data.needsAttention.length > 0 && (
        <section>
          <h3 className="font-display text-sm font-bold text-red-700">Needs attention</h3>
          <p className="mt-0.5 text-xs text-muted">Citation dropped more than 10% this week</p>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {data.needsAttention.map((w) => (
              <li key={w.id}>
                <button
                  type="button"
                  onClick={() => void switchWorkspace(w.id)}
                  className="flex w-full flex-col rounded-xl border border-red-200 bg-red-50/80 p-4 text-left transition hover:border-red-300 dark:border-red-900/50 dark:bg-red-950/30"
                >
                  <span className="font-semibold text-ink">
                    {w.displayName || w.domain}
                  </span>
                  <span className="mt-1 text-xs text-red-700">
                    {w.citationScore} score · {w.scoreDeltaWeek} pts this week
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h3 className="font-display text-sm font-bold text-ink">Recent scan activity</h3>
        <ul className="mt-3 divide-y divide-border rounded-2xl border border-border bg-card">
          {data.recentActivity.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-muted">No scans yet.</li>
          )}
          {data.recentActivity.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <button
                type="button"
                onClick={() => void switchWorkspace(item.workspaceId)}
                className="min-w-0 text-left text-sm font-medium text-ink hover:text-accent"
              >
                {item.domain}
              </button>
              <div className="flex shrink-0 items-center gap-3 text-xs text-muted">
                <span className="font-semibold text-ink">{item.score}</span>
                <span>{formatWhen(item.createdAt)}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
