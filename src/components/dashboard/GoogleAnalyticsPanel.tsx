"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { effectInit } from "@/lib/react/effect-init";
import type { GscMetrics } from "@/lib/gsc/client";
import { Panel } from "@/components/dashboard/DashboardUI";
import { GoogleAnalyticsChartsGrid } from "@/components/dashboard/analytics/GoogleAnalyticsChartsGrid";
import { useToast } from "@/components/notifications/ToastProvider";
import type { WorkspaceSnapshot } from "@/lib/dashboard";
import { buildOrganicCitationBridge } from "@/lib/analytics/organic-citation-bridge";

export function GoogleAnalyticsPanel({
  workspace,
  preferOrganicLead = false,
}: {
  workspace: WorkspaceSnapshot;
  preferOrganicLead?: boolean;
}) {
  const toast = useToast();
  const workspaceId = workspace.workspaceId ?? workspace.id;
  const [metrics, setMetrics] = useState<GscMetrics | null>(null);
  const [configured, setConfigured] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  const loadServerGscConfig = useCallback(async () => {
    const res = await fetch("/api/gsc/status", { credentials: "include" });
    if (!res.ok) return false;
    const data = (await res.json()) as { configured?: boolean };
    return Boolean(data.configured);
  }, []);

  const load = useCallback(async () => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);

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
      setLoading(false);
      return;
    }

    const serverConfigured = await loadServerGscConfig();
    setConfigured(serverConfigured);

    if (res.status === 401) {
      setLoadError("Sign in again to load Search Console for this workspace.");
    } else if (res.status === 404) {
      setLoadError("Workspace not found — refresh the page or re-select your workspace.");
    } else {
      setLoadError("Could not load Search Console status. Try refreshing.");
    }
    setMetrics(null);
    setLoading(false);
  }, [workspaceId, loadServerGscConfig]);

  useEffect(() => {
    effectInit(() => {
      void load();
    });
  }, [load]);

  async function connectGsc() {
    if (!workspaceId) return;
    if (!configured) {
      toast.error(
        "Google Search Console is not configured on the server. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, then redeploy.",
      );
      return;
    }
    setConnecting(true);
    try {
      const res = await fetch(
        `/api/gsc/connect?workspaceId=${encodeURIComponent(workspaceId)}`,
        { credentials: "include" },
      );
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        toast.error(
          data.error ??
            "Could not start Search Console connection. Check Google OAuth env vars on the host.",
        );
        return;
      }
      window.location.href = data.url;
    } catch {
      toast.error("Could not start Search Console connection.");
    } finally {
      setConnecting(false);
    }
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

  const bridge = useMemo(
    () =>
      buildOrganicCitationBridge({
        citationHistory: workspace.citationHistory ?? [],
        citationScore: workspace.citationScore,
        gsc: metrics,
      }),
    [workspace.citationHistory, workspace.citationScore, metrics],
  );

  return (
    <>
      <GoogleAnalyticsChartsGrid
        workspace={workspace}
        metrics={metrics}
        connected={connected}
        loading={loading}
      />

      {loadError && (
        <div
          className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4"
          role="alert"
        >
          <p className="text-sm font-medium text-red-800">{loadError}</p>
        </div>
      )}

      {!configured && !loadError && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-[linear-gradient(135deg,rgba(254,243,199,0.7),rgba(255,251,235,0.98))] px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-800">
            Search Console setup
          </p>
          <p className="mt-2 text-sm text-amber-950">
            Add <code className="text-xs">GOOGLE_CLIENT_ID</code> and{" "}
            <code className="text-xs">GOOGLE_CLIENT_SECRET</code> on the server (Vercel
            Production), then redeploy.
          </p>
        </div>
      )}

      {configured && !connected && !loading && (
        <div className="mt-4 rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/[0.06] via-card to-card px-5 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
            Search Console connection
          </p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">
                Connect Google Search Console for real clicks, impressions, and average
                position for {workspace.domain}.
              </p>
              <p className="mt-1 text-sm text-muted">
                Until GSC is connected, organic metrics show as unavailable — not
                estimated placeholders.
              </p>
            </div>
            <button
              type="button"
              disabled={connecting}
              onClick={() => void connectGsc()}
              className="rounded-full bg-gradient-to-r from-[#7b93f0] via-[#6b8cff] to-accent px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(107,140,255,0.28)] disabled:opacity-50"
            >
              {connecting ? "Redirecting…" : "Connect Google Search Console"}
            </button>
          </div>
        </div>
      )}

      {connected && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-white px-4 py-3 shadow-sm">
          <span className="rounded-full bg-mint/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-mint">
            Live organic data
          </span>
          <p className="text-sm text-muted">
            GSC property: <span className="font-semibold text-ink">{metrics?.siteUrl}</span>
          </p>
          <button
            type="button"
            onClick={() => void disconnect()}
            className="text-sm font-semibold text-accent hover:underline"
          >
            Disconnect
          </button>
        </div>
      )}

      <Panel
        title={preferOrganicLead ? "Organic insights" : "Organic performance"}
        className="mt-6"
      >
        <div className="mb-6 dash-gradient-panel overflow-hidden rounded-2xl border border-border p-5 dark:border-accent/15">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
                Real traffic layer
              </p>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
                {connected
                  ? "Clicks and impressions come directly from Google Search Console. Citation trends below use saved audit history from CitePilot."
                  : "Connect Search Console to lead this tab with measured organic demand instead of unavailable metrics."}
              </p>
            </div>
            <div className="rounded-full border border-border bg-card px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink shadow-sm dark:border-[#333] dark:bg-[#161616]">
              {connected ? "Live Google data" : "Not connected"}
            </div>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-muted">Loading Search Console data…</p>
        ) : !connected ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard label="Organic clicks (28d)" value="—" unavailable />
            <MetricCard label="Impressions" value="—" unavailable />
            <MetricCard label="Avg. position" value="—" unavailable />
          </div>
        ) : null}

        <div className="mt-6 rounded-2xl border border-border bg-surface/50 px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
            Citation vs organic
          </p>
          <p className="mt-2 font-semibold text-ink">{bridge.headline}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">{bridge.summary}</p>
          {bridge.evidence.length > 0 && (
            <ul className="mt-3 space-y-1.5 text-sm text-muted">
              {bridge.evidence.map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="text-accent">•</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Panel>

      {connected && (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <MiniStat label="Citation score" value={String(workspace.citationScore)} />
          <MiniStat
            label="Platforms cited"
            value={`${workspace.citedPlatforms}/${workspace.totalPlatforms}`}
          />
          <MiniStat
            label="Referring pages"
            value={workspace.sourceCount > 0 ? String(workspace.sourceCount) : "—"}
          />
        </div>
      )}
    </>
  );
}

function MetricCard({
  label,
  value,
  delta,
  unavailable = false,
}: {
  label: string;
  value: string;
  delta?: string;
  unavailable?: boolean;
}) {
  return (
    <div className="dash-metric-card rounded-2xl border border-border px-4 py-4 shadow-sm dark:border-[#222]">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="font-display mt-2 text-3xl font-bold text-ink">{value}</p>
      {unavailable ? (
        <p className="mt-2 text-xs text-muted">Connect GSC to measure</p>
      ) : (
        delta && (
          <p className="mt-2 text-xs font-semibold text-mint">{delta} vs prior 28d</p>
        )
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="font-display mt-2 text-3xl font-bold text-ink">{value}</p>
    </div>
  );
}
