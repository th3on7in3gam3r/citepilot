"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Panel } from "@/components/dashboard/DashboardUI";
import { formatScanTrigger } from "@/lib/scans/history-format";
import type { AuditTrigger } from "@/lib/scans/types";

type HistoryRow = {
  id: string;
  createdAt: string;
  trigger: AuditTrigger;
  triggerLabel: string;
  durationMs: number | null;
  promptsScanned: number;
  citationRate: number;
  scoreDelta: number | null;
};

function formatDuration(ms: number | null): string {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms}ms`;
  const secs = Math.round(ms / 1000);
  if (secs < 60) return `${secs}s`;
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ScanHistoryPanel({
  workspaceId,
  compact = false,
}: {
  workspaceId: string;
  compact?: boolean;
}) {
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) return;
    setLoading(true);
    void fetch(`/api/workspaces/${workspaceId}/scan-history?limit=${compact ? 5 : 50}`, {
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { history?: HistoryRow[] } | null) => setRows(d?.history ?? []))
      .finally(() => setLoading(false));
  }, [workspaceId, compact]);

  if (loading) {
    return <p className="text-sm text-muted">Loading scan history…</p>;
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted">
        No scans recorded yet. Run a citation audit to start building your audit trail.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
            <th className="px-3 py-2 font-semibold">Date</th>
            <th className="px-3 py-2 font-semibold">Trigger</th>
            <th className="px-3 py-2 font-semibold">Duration</th>
            <th className="px-3 py-2 font-semibold">Prompts</th>
            <th className="px-3 py-2 font-semibold">Citation rate</th>
            <th className="px-3 py-2 font-semibold">Change</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-border/60">
              <td className="px-3 py-2.5 text-ink">{formatDate(row.createdAt)}</td>
              <td className="px-3 py-2.5 text-ink">
                {row.triggerLabel || formatScanTrigger(row.trigger)}
              </td>
              <td className="px-3 py-2.5 text-muted">{formatDuration(row.durationMs)}</td>
              <td className="px-3 py-2.5 text-ink">{row.promptsScanned}</td>
              <td className="px-3 py-2.5 font-semibold text-ink">{row.citationRate}%</td>
              <td className="px-3 py-2.5">
                {row.scoreDelta == null ? (
                  <span className="text-muted">—</span>
                ) : row.scoreDelta === 0 ? (
                  <span className="text-muted">No change</span>
                ) : (
                  <span
                    className={
                      row.scoreDelta > 0 ? "font-semibold text-mint" : "font-semibold text-red-600"
                    }
                  >
                    {row.scoreDelta > 0 ? `+${row.scoreDelta}` : row.scoreDelta} pts
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {compact && (
        <Link
          href="/dashboard/settings/scan-schedule"
          className="mt-3 inline-block text-sm font-semibold text-accent hover:underline"
        >
          View full scan history →
        </Link>
      )}
    </div>
  );
}

export function ScanHistorySection({ workspaceId }: { workspaceId: string }) {
  return (
    <Panel title="Scan history" className="mt-6">
      <p className="mb-4 text-sm text-muted">
        Audit trail of every citation scan — proof that monitoring is running.
      </p>
      <ScanHistoryPanel workspaceId={workspaceId} />
    </Panel>
  );
}
