"use client";

import { useCallback, useEffect, useState } from "react";
import type { GscMetrics } from "@/lib/gsc/client";
import { Panel } from "@/components/dashboard/DashboardUI";
import { CitationVolumeChart } from "@/components/dashboard/CitationVolumeChart";
import type { WorkspaceSnapshot } from "@/lib/dashboard";
import { domainSeed } from "@/lib/dashboard";

export function GoogleAnalyticsPanel({
  workspace,
}: {
  workspace: WorkspaceSnapshot;
}) {
  const workspaceId = workspace.workspaceId ?? workspace.id;
  const seed = domainSeed(workspace.domain);
  const [metrics, setMetrics] = useState<GscMetrics | null>(null);
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  const load = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    const res = await fetch(
      `/api/gsc/metrics?workspaceId=${encodeURIComponent(workspaceId)}`,
      { credentials: "include" },
    );
    if (res.ok) {
      const data = (await res.json()) as {
        configured: boolean;
        metrics: GscMetrics;
      };
      setConfigured(data.configured);
      setMetrics(data.metrics);
    }
    setLoading(false);
  }, [workspaceId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function connectGsc() {
    if (!workspaceId) return;
    setConnecting(true);
    const res = await fetch(
      `/api/gsc/connect?workspaceId=${encodeURIComponent(workspaceId)}`,
      { credentials: "include" },
    );
    const data = (await res.json()) as { url?: string; error?: string };
    setConnecting(false);
    if (data.url) window.location.href = data.url;
  }

  async function disconnect() {
    if (!workspaceId) return;
    await fetch("/api/gsc/metrics", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ workspaceId }),
    });
    await load();
  }

  const connected = metrics?.connected ?? false;

  return (
    <>
      {!configured && (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Add <code className="text-xs">GOOGLE_CLIENT_ID</code> and{" "}
          <code className="text-xs">GOOGLE_CLIENT_SECRET</code> to enable Search
          Console.
        </p>
      )}

      {configured && !connected && !loading && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={connecting}
            onClick={() => void connectGsc()}
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {connecting ? "Redirecting…" : "Connect Google Search Console"}
          </button>
          <p className="text-sm text-muted">
            Pull real clicks and impressions for {workspace.domain}
          </p>
        </div>
      )}

      {connected && (
        <p className="mt-4 text-xs text-muted">
          GSC property: {metrics?.siteUrl}{" "}
          <button
            type="button"
            onClick={() => void disconnect()}
            className="ml-2 text-accent hover:underline"
          >
            Disconnect
          </button>
        </p>
      )}

      <Panel title="Organic performance" className="mt-6">
        {loading ? (
          <p className="text-sm text-muted">Loading Search Console data…</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard
              label="Organic clicks (28d)"
              value={connected ? String(metrics!.clicks) : "—"}
              delta={metrics?.clicksDelta ?? undefined}
            />
            <MetricCard
              label="Impressions"
              value={
                connected ? metrics!.impressions.toLocaleString() : "—"
              }
              delta={metrics?.impressionsDelta ?? undefined}
            />
            <MetricCard
              label="Avg. position"
              value={connected ? metrics!.position.toFixed(1) : "—"}
            />
          </div>
        )}
        <div className="mt-6">
          <CitationVolumeChart
            seed={seed}
            compact
            citationScore={workspace.citationScore}
            hasRealAudit={workspace.hasRealAudit}
          />
        </div>
      </Panel>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <MiniStat label="Domain rating" value={String(workspace.domainRating)} />
        <MiniStat label="Referring pages" value={String(workspace.sourceCount)} />
        <MiniStat label="Citation score" value={String(workspace.citationScore)} />
      </div>
    </>
  );
}

function MetricCard({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="font-display mt-1 text-2xl font-bold text-ink">{value}</p>
      {delta && (
        <p className="mt-1 text-xs font-semibold text-mint">{delta} vs prior 28d</p>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-ink">{label}</p>
      <p className="font-display mt-2 text-3xl font-bold text-ink">{value}</p>
    </div>
  );
}
