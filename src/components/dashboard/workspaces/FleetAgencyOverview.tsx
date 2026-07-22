"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkspaceSwitcher } from "@/contexts/WorkspaceSwitcherContext";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { useToast } from "@/components/notifications/ToastProvider";
import { CiteStatusBadge } from "@/components/dashboard/CiteStatusBadge";
import { DashboardPageHeader } from "@/components/dashboard/DashboardUI";
import { DashboardPageSkeleton } from "@/components/dashboard/layout/DashboardPageSkeleton";
import { dashPrimaryCta, dashSecondaryCta } from "@/lib/dashboard/surface-classes";
import { fleetWorkspaceDashboardHref } from "@/lib/workspace/fleet-dashboard";
import type { WorkspaceListItem } from "@/hooks/useWorkspace";

type BulkScanStatus = {
  jobId: string | null;
  status: "idle" | "queued" | "running" | "completed" | "failed";
  total: number;
  completed: number;
  failed: number;
  skipped: number;
  progressLabel: string | null;
};

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

function BulkScanProgressBar({
  status,
  onDismiss,
}: {
  status: BulkScanStatus;
  onDismiss: () => void;
}) {
  const done = status.completed + status.failed + status.skipped;
  const pct = status.total > 0 ? Math.round((done / status.total) * 100) : 0;
  const complete = status.status === "completed" || status.status === "failed";

  return (
    <div
      className={`rounded-2xl border px-4 py-3 ${
        complete
          ? "border-mint/40 bg-mint/5"
          : "border-accent/30 bg-accent/5"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink">
          {complete
            ? `All ${status.total} workspaces scanned ✓`
            : status.progressLabel ?? `Scanning ${status.total} workspaces…`}
        </p>
        {complete && (
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/workspaces"
              className="text-sm font-semibold text-accent hover:underline"
            >
              View results →
            </Link>
            <button
              type="button"
              onClick={onDismiss}
              className="text-xs text-muted hover:text-ink"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
      {!complete && (
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/80">
          <div
            className="h-full rounded-full bg-accent transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
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
        {item.hasRealAudit ? (
          <CiteStatusBadge score={item.citationScore} size="sm" />
        ) : (
          <span className="shrink-0 rounded-full bg-surface px-2.5 py-1 text-sm font-bold text-muted">
            —
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-muted">Prompts</p>
          <p className="mt-0.5 font-semibold text-ink">{item.promptCount ?? 0}</p>
        </div>
        <div>
          <p className="text-muted">Last scan</p>
          <p className="mt-0.5 font-semibold text-ink">
            {item.scanInProgress ? (
              <span className="text-accent">Scan in progress…</span>
            ) : (
              formatScanDate(item.lastScanAt)
            )}
          </p>
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
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<BulkScanStatus | null>(null);
  const [dismissedJobId, setDismissedJobId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const pollBulkStatus = useCallback(async (jobId?: string | null) => {
    const qs = jobId ? `?jobId=${encodeURIComponent(jobId)}` : "";
    const res = await fetch(`/api/scans/bulk-status${qs}`, { credentials: "include" });
    if (!res.ok) return;
    const body = (await res.json()) as BulkScanStatus & { ok?: boolean };
    setBulkStatus(body);
    if (body.status === "completed" || body.status === "failed") {
      void load();
    }
    return body;
  }, [load]);

  useEffect(() => {
    void load().finally(() => setLoading(false));
    void pollBulkStatus().then((s) => {
      if (s && (s.status === "queued" || s.status === "running")) {
        setBulkStatus(s);
      }
    });
  }, [load, pollBulkStatus]);

  useEffect(() => {
    if (!bulkStatus || bulkStatus.status === "idle") return;
    if (bulkStatus.status !== "queued" && bulkStatus.status !== "running") return;

    pollRef.current = setInterval(() => {
      void pollBulkStatus(bulkStatus.jobId);
    }, 10_000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [bulkStatus, pollBulkStatus]);

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

  async function runAllScans() {
    if (!data) return;
    setBulkBusy(true);
    try {
      const res = await fetch("/api/scans/bulk-run", {
        method: "POST",
        credentials: "include",
      });
      const body = (await res.json()) as {
        error?: string;
        jobId?: string;
        queued?: number;
        estimatedMinutes?: number;
      };
      if (!res.ok) {
        toast.error(body.error ?? "Bulk scan failed");
        return;
      }
      toast.success(
        `Queued ${body.queued ?? 0} workspace scan${body.queued === 1 ? "" : "s"} (~${body.estimatedMinutes ?? "?"} min)`,
      );
      const status = await pollBulkStatus(body.jobId);
      if (status) setBulkStatus(status);
    } finally {
      setBulkBusy(false);
    }
  }

  async function runBulkExport() {
    if (!data) return;
    const ids = data.workspaces.map((w) => w.id);
    if (ids.length === 0) return;

    setBulkBusy(true);
    try {
      const res = await fetch("/api/workspaces/bulk", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "export", workspaceIds: ids }),
      });
      const body = (await res.json()) as {
        exports?: { workspaceId: string; url: string }[];
      };
      if (!res.ok) {
        toast.error("Bulk export failed");
        return;
      }
      if (body.exports) {
        for (const exp of body.exports) {
          window.open(exp.url, "_blank");
        }
        toast.success(`Opened ${body.exports.length} export${body.exports.length === 1 ? "" : "s"}`);
      }
    } finally {
      setBulkBusy(false);
    }
  }

  const showProgress =
    bulkStatus &&
    bulkStatus.jobId !== dismissedJobId &&
    bulkStatus.status !== "idle";

  if (loading) return <DashboardPageSkeleton />;

  if (!data) {
    return (
      <p className="text-sm text-muted">Unable to load agency overview.</p>
    );
  }

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        headingLevel="h2"
        title={`${data.workspaceCount} client workspace${data.workspaceCount === 1 ? "" : "s"}`}
        description="Fleet dashboard — monitor citation health across all client sites."
        action={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={bulkBusy || bulkStatus?.status === "running" || bulkStatus?.status === "queued"}
              onClick={() => void runAllScans()}
              className={dashSecondaryCta}
            >
              {bulkBusy || bulkStatus?.status === "running" || bulkStatus?.status === "queued"
                ? "Scanning…"
                : "Run all scans"}
            </button>
            <button
              type="button"
              disabled={bulkBusy}
              onClick={() => void runBulkExport()}
              className={dashSecondaryCta}
            >
              Export all reports
            </button>
            <button type="button" onClick={openWizard} className={dashPrimaryCta}>
              Add workspace →
            </button>
          </div>
        }
      />

      {showProgress && (
        <BulkScanProgressBar
          status={bulkStatus}
          onDismiss={() => setDismissedJobId(bulkStatus.jobId)}
        />
      )}

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
            <button type="button" onClick={openWizard} className={`${dashPrimaryCta} mt-5`}>
              Add workspace →
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
