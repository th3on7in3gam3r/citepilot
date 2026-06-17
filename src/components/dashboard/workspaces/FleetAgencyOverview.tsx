"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkspaceSwitcher } from "@/contexts/WorkspaceSwitcherContext";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { useToast } from "@/components/notifications/ToastProvider";
import { DashboardPageSkeleton } from "@/components/dashboard/layout/DashboardPageSkeleton";
import { fleetWorkspaceDashboardHref } from "@/lib/workspace/fleet-dashboard";
import type { WorkspaceListItem } from "@/hooks/useWorkspace";

type AgencyOverview = {
  workspaceCount: number;
  weightedCitationScore: number;
  totalPrompts: number;
  activeCount: number;
  pausedCount: number;
  auditedCount: number;
  workspaces: WorkspaceListItem[];
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
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatScanDate(iso: string | null | undefined): string {
  if (!iso) return "Never";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function scoreBadgeClass(score: number, hasAudit: boolean): string {
  if (!hasAudit) return "bg-surface text-muted";
  if (score >= 70) return "bg-mint/15 text-mint";
  if (score >= 40) return "bg-amber-100 text-amber-800";
  return "bg-red-100 text-red-700";
}

function KpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="font-display mt-2 text-3xl font-bold text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

function WorkspaceOverviewCard({
  item,
  onSelect,
}: {
  item: WorkspaceListItem;
  onSelect: () => void;
}) {
  const delta = item.scoreDeltaWeek;
  const deltaLabel =
    delta == null
      ? null
      : delta === 0
        ? "No change this week"
        : delta > 0
          ? `+${delta} pts this week`
          : `${delta} pts this week`;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full flex-col rounded-2xl border border-border bg-card p-5 text-left transition hover:border-accent/40 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">
            {item.displayName || item.domain}
          </p>
          {item.displayName && (
            <p className="truncate text-xs text-muted">{item.domain}</p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-sm font-bold ${scoreBadgeClass(item.citationScore, item.hasRealAudit)}`}
        >
          {item.hasRealAudit ? item.citationScore : "—"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-muted">Prompts</p>
          <p className="mt-0.5 font-semibold text-ink">{item.promptCount ?? 0}</p>
        </div>
        <div>
          <p className="text-muted">Last scan</p>
          <p className="mt-0.5 font-semibold text-ink">{formatScanDate(item.lastScanAt)}</p>
        </div>
        <div>
          <p className="text-muted">Status</p>
          <p
            className={`mt-0.5 font-semibold ${
              item.status === "paused" ? "text-amber-700" : "text-mint"
            }`}
          >
            {item.status === "paused" ? "Paused" : "Active"}
          </p>
        </div>
        <div>
          <p className="text-muted">Weekly trend</p>
          <p
            className={`mt-0.5 font-semibold ${
              delta != null && delta < 0
                ? "text-red-600"
                : delta != null && delta > 0
                  ? "text-mint"
                  : "text-ink"
            }`}
          >
            {deltaLabel ?? "—"}
          </p>
        </div>
      </div>

      <p className="mt-4 text-xs font-semibold text-accent">Open workspace →</p>
    </button>
  );
}

export function FleetAgencyOverview() {
  const router = useRouter();
  const { switchWorkspace, workspace: activeWorkspace } = useWorkspaceContext();
  const { openWizard } = useWorkspaceSwitcher();
  const toast = useToast();
  const [data, setData] = useState<AgencyOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [bulkBusy, setBulkBusy] = useState<string | null>(null);

  const openWorkspace = useCallback(
    async (id: string) => {
      await switchWorkspace(id);
      router.push(fleetWorkspaceDashboardHref(id));
    },
    [router, switchWorkspace],
  );

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

  const activeId = activeWorkspace?.workspaceId ?? activeWorkspace?.id;

  const activityWithDelta = useMemo(() => {
    if (!data) return [];
    return data.recentActivity.map((item, index, arr) => {
      const older = arr[index + 1];
      const delta =
        older && older.workspaceId === item.workspaceId
          ? item.score - older.score
          : null;
      return { ...item, delta };
    });
  }, [data]);

  async function runBulk(action: "scan" | "export") {
    if (!data) return;
    const ids = data.workspaces.map((w) => w.id);
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
          <p className="mt-1 text-sm text-muted">
            Fleet dashboard — monitor citation health across all client sites.
          </p>
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Weighted citation score"
          value={String(data.weightedCitationScore)}
          hint={`Across ${data.auditedCount} audited workspace${data.auditedCount === 1 ? "" : "s"}`}
        />
        <KpiCard
          label="Monitored prompts"
          value={String(data.totalPrompts)}
          hint="Total across all workspaces"
        />
        <KpiCard
          label="Active workspaces"
          value={String(data.activeCount)}
          hint={
            data.pausedCount > 0
              ? `${data.pausedCount} paused`
              : "All workspaces active"
          }
        />
        <KpiCard
          label="Needs attention"
          value={String(data.needsAttention.length)}
          hint={
            data.needsAttention.length > 0
              ? "Citation dropped >10% this week"
              : "All workspaces healthy"
          }
        />
      </div>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-sm font-bold text-ink">Client workspaces</h3>
            <p className="mt-0.5 text-xs text-muted">
              Citation score, prompts, scan status, and weekly trend per site
            </p>
          </div>
          <Link
            href="/dashboard/workspaces"
            className="text-sm font-semibold text-accent hover:underline"
          >
            Manage all →
          </Link>
        </div>

        {data.workspaces.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
            <p className="font-display text-lg font-bold text-ink">No workspaces yet</p>
            <p className="mt-2 text-sm text-muted">
              Add your first client site to start tracking citations at scale.
            </p>
            <button
              type="button"
              onClick={openWizard}
              className="mt-5 rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white"
            >
              + Add workspace
            </button>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {data.workspaces.map((item) => (
              <li key={item.id}>
                <WorkspaceOverviewCard
                  item={item}
                  onSelect={() => void openWorkspace(item.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="font-display text-sm font-bold text-ink">Needs attention</h3>
        <p className="mt-0.5 text-xs text-muted">
          Workspaces where citation score dropped more than 10 points this week
        </p>
        {data.needsAttention.length === 0 ? (
          <div className="mt-3 rounded-xl border border-mint/30 bg-mint/5 px-4 py-3 text-sm text-ink">
            All workspaces are stable — no significant citation drops detected this week.
          </div>
        ) : (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {data.needsAttention.map((w) => (
              <li key={w.id}>
                <button
                  type="button"
                  onClick={() => void openWorkspace(w.id)}
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
        )}
      </section>

      <section>
        <h3 className="font-display text-sm font-bold text-ink">Recent scan activity</h3>
        <p className="mt-0.5 text-xs text-muted">
          Latest citation audits across your portfolio
        </p>
        <ul className="mt-3 divide-y divide-border rounded-2xl border border-border bg-card">
          {activityWithDelta.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-muted">No scans yet.</li>
          )}
          {activityWithDelta.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <button
                type="button"
                onClick={() => void openWorkspace(item.workspaceId)}
                className="min-w-0 text-left"
              >
                <p className="truncate text-sm font-medium text-ink hover:text-accent">
                  {item.domain}
                </p>
                {item.workspaceId === activeId && (
                  <p className="text-[11px] text-muted">Currently selected</p>
                )}
              </button>
              <div className="flex shrink-0 items-center gap-3 text-xs">
                <span className="font-semibold text-ink">{item.score}/100</span>
                {item.delta != null && item.delta !== 0 && (
                  <span
                    className={
                      item.delta > 0 ? "font-semibold text-mint" : "font-semibold text-red-600"
                    }
                  >
                    {item.delta > 0 ? `+${item.delta}` : item.delta}
                  </span>
                )}
                <span className="text-muted">{formatWhen(item.createdAt)}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
