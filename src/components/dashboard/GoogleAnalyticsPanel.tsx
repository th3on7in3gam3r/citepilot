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
        <div className="mt-4 rounded-2xl border border-amber-200 bg-[linear-gradient(135deg,rgba(254,243,199,0.7),rgba(255,251,235,0.98))] px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-800">
            Search Console setup
          </p>
          <p className="mt-2 text-sm text-amber-950">
            Add <code className="text-xs">GOOGLE_CLIENT_ID</code> and{" "}
            <code className="text-xs">GOOGLE_CLIENT_SECRET</code> to enable Search
            Console.
          </p>
        </div>
      )}

      {configured && !connected && !loading && (
        <div className="mt-4 rounded-2xl border border-[#d7def8] bg-[linear-gradient(135deg,rgba(123,147,240,0.08),rgba(255,255,255,0.98),rgba(34,211,238,0.06))] px-5 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
            Search Console connection
          </p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">
                Connect Google Search Console to unlock real clicks, impressions, and
                ranking data for {workspace.domain}.
              </p>
              <p className="mt-1 text-sm text-muted">
                This turns the Google tab into a live performance view instead of an
                estimated placeholder.
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
            Connected
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

      <Panel title="Organic performance" className="mt-6">
        <div className="mb-6 overflow-hidden rounded-2xl border border-[#d7def8] bg-[linear-gradient(135deg,rgba(123,147,240,0.08),rgba(255,255,255,0.98),rgba(34,211,238,0.08))] p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
                Organic snapshot
              </p>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
                Blend Search Console performance with CitePilot citation monitoring so
                your team can see demand, ranking movement, and answer-surface visibility
                in one place.
              </p>
            </div>
            <div className="rounded-full border border-white/80 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink shadow-sm">
              {connected ? "Live Google data" : "Awaiting connection"}
            </div>
          </div>
        </div>
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
            citationHistory={workspace.citationHistory}
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
    <div className="rounded-2xl border border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.96))] px-4 py-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="font-display mt-2 text-3xl font-bold text-ink">{value}</p>
      {delta && (
        <p className="mt-2 text-xs font-semibold text-mint">{delta} vs prior 28d</p>
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
