"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { effectInit } from "@/lib/react/effect-init";
import { DashboardPageHeader, Panel } from "@/components/dashboard/DashboardUI";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import type {
  BacklinkDashboard,
  BacklinkPlacement,
  PlacementStatus,
} from "@/lib/backlinks/types";
import { productFeatures } from "@/lib/features";

const feature = productFeatures.find((f) => f.id === "backlinks")!;

const statusStyle: Record<PlacementStatus, string> = {
  queued: "bg-amber-50 text-amber-900",
  pending_partner: "bg-sky-50 text-sky-900",
  accepted: "bg-violet-50 text-violet-900",
  live: "bg-emerald-50 text-emerald-800",
  declined: "bg-red-50 text-red-800",
  cancelled: "bg-surface text-muted",
};

const statusLabel: Record<PlacementStatus, string> = {
  queued: "Queued",
  pending_partner: "Awaiting partner",
  accepted: "Accepted",
  live: "Live",
  declined: "Declined",
  cancelled: "Cancelled",
};

export function BacklinksPanel() {
  const { workspace, ready } = useWorkspaceContext();
  const [data, setData] = useState<BacklinkDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [targetUrl, setTargetUrl] = useState("");
  const [anchorText, setAnchorText] = useState("");
  const [contextNote, setContextNote] = useState("");
  const [preferredPartnerId, setPreferredPartnerId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const workspaceId = workspace?.workspaceId ?? workspace?.id;

  const load = useCallback(
    async (opts?: { refresh?: boolean }) => {
      if (!workspaceId) return;
      setError(null);
      if (opts?.refresh) setRefreshing(true);
      else setLoading(true);

      try {
        const q = new URLSearchParams({ workspaceId });
        if (opts?.refresh) q.set("refresh", "0");
        const res = await fetch(`/api/backlinks?${q}`, { credentials: "include" });
        const json = (await res.json()) as BacklinkDashboard & { error?: string };
        if (!res.ok) {
          setError(json.error ?? "Could not load backlinks");
          return;
        }
        setData(json);
      } catch {
        setError("Network error — try again");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [workspaceId],
  );

  useEffect(() => {
    effectInit(() => {
      void load();
    });
  }, [load]);

  useEffect(() => {
    if (workspace?.domain && !targetUrl) {
      effectInit(() => {
        setTargetUrl(`https://${workspace.domain.replace(/^https?:\/\//, "")}/`);
      });
    }
  }, [workspace?.domain, targetUrl]);

  async function handleRefresh() {
    if (!workspaceId) return;
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch("/api/backlinks/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ workspaceId }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Refresh failed");
        return;
      }
      setMessage("Backlink profile updated.");
      await load({ refresh: true });
    } catch {
      setError("Network error — try again");
    } finally {
      setRefreshing(false);
    }
  }

  async function toggleNetwork(optedIn: boolean) {
    if (!workspaceId) return;
    setError(null);
    const res = await fetch("/api/backlinks/network", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ workspaceId, optedIn }),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(json.error ?? "Could not update network settings");
      return;
    }
    setMessage(optedIn ? "You joined the CitePilot link network." : "You left the network.");
    await load({ refresh: true });
  }

  async function submitRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!workspaceId) return;
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/backlinks/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          workspaceId,
          targetUrl: targetUrl.trim(),
          anchorText: anchorText.trim(),
          contextNote: contextNote.trim() || undefined,
          preferredPartnerId: preferredPartnerId || undefined,
        }),
      });
      const json = (await res.json()) as { error?: string; placement?: BacklinkPlacement };
      if (!res.ok) {
        setError(json.error ?? "Request failed");
        return;
      }
      setMessage(
        json.placement?.status === "queued"
          ? "Placement queued — we will match a network partner when one is available."
          : `Request sent to ${json.placement?.partnerDomain ?? "network partner"}.`,
      );
      setAnchorText("");
      setContextNote("");
      await load({ refresh: true });
    } catch {
      setError("Network error — try again");
    } finally {
      setSubmitting(false);
    }
  }

  async function placementAction(
    placementId: string,
    action: "accept" | "decline" | "mark_live" | "cancel",
  ) {
    if (!workspaceId) return;
    setError(null);
    const res = await fetch(`/api/backlinks/placements/${placementId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ workspaceId, action }),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(json.error ?? "Action failed");
      return;
    }
    setMessage("Placement updated.");
    await load({ refresh: true });
  }

  if (!ready || !workspace || !workspaceId) return null;

  const profile = data?.profile;
  const network = data?.network;
  const creditsLeft = network?.creditsRemaining ?? 0;

  return (
    <>
      <DashboardPageHeader
        headingLevel="h2"
        title="Backlink workspace"
        description={feature.description}
      />

      {!data?.searchConfigured && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-semibold">Web search not configured</p>
          <p className="mt-1 text-amber-900">
            Add <code className="text-xs">SERPER_API_KEY</code> or{" "}
            <code className="text-xs">TAVILY_API_KEY</code> to discover referring
            pages. Competitors from Settings still appear as peer targets.
          </p>
        </div>
      )}

      {message && (
        <p className="mb-4 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-ink">
          {message}
        </p>
      )}
      {error && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Domain authority">
          {loading ? (
            <p className="text-sm text-muted">Loading profile…</p>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                Domain rating
              </p>
              <p className="font-display mt-2 text-5xl font-bold text-ink">
                {profile?.domainRating ?? workspace.domainRating}
              </p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-500"
                  style={{
                    width: `${Math.min(100, profile?.domainRating ?? workspace.domainRating)}%`,
                  }}
                />
              </div>
              <p className="mt-3 text-sm text-muted">
                {profile?.referringCount ?? 0} referring pages found
                {profile?.openPageRank != null
                  ? ` · Open PageRank ${profile.openPageRank.toFixed(1)}`
                  : data?.openPageRankConfigured
                    ? ""
                    : " · add OPEN_PAGERANK_API_KEY for third-party DR"}
                {profile?.discoveredAt
                  ? ` · updated ${new Date(profile.discoveredAt).toLocaleDateString()}`
                  : ""}
              </p>
              <button
                type="button"
                onClick={() => void handleRefresh()}
                disabled={refreshing}
                className="mt-4 rounded-full border border-border px-4 py-2 text-xs font-semibold text-ink hover:bg-surface disabled:opacity-50"
              >
                {refreshing ? "Scanning…" : "Refresh backlink scan"}
              </button>
            </>
          )}
        </Panel>

        <Panel title="Network & credits">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-display text-3xl font-bold text-ink">
                {creditsLeft}
                <span className="text-lg font-normal text-muted">
                  {" "}
                  / {network?.creditsTotal ?? 100}
                </span>
              </p>
              <p className="mt-2 text-sm text-muted">
                Credits for contextual placements across opted-in CitePilot sites.
              </p>
            </div>
            <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm font-medium text-ink">
              <input
                type="checkbox"
                checked={network?.optedIn ?? false}
                onChange={(e) => void toggleNetwork(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-accent"
              />
              Join network
            </label>
          </div>
          {!network?.optedIn && (
            <p className="mt-3 text-xs text-amber-800">
              Opt in to request placements and appear as a match for other members.
            </p>
          )}
        </Panel>
      </div>

      <Panel title="Referring pages & outreach" className="mt-6">
        <p className="mb-4 text-sm text-muted">
          Pages that mention or link to your domain (from web search) plus tracked
          competitors.
        </p>
        {loading ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : (profile?.sources.length ?? 0) === 0 ? (
          <p className="text-sm text-muted">
            No sources yet — run a refresh or add competitors in Settings.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {profile!.sources.map((s) => (
              <li
                key={s.id}
                className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-accent hover:underline"
                  >
                    {s.title}
                  </a>
                  <p className="text-xs text-muted">{s.sourceDomain}</p>
                </div>
                <span className="shrink-0 rounded-full bg-surface px-2.5 py-0.5 text-[11px] font-semibold uppercase text-muted">
                  {s.discoverySource}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="CitePilot network peers" className="mt-6">
        <p className="mb-4 text-sm text-muted">
          Other members who opted in — best matches listed first by industry and
          competitor overlap.
        </p>
        {(data?.peers.length ?? 0) === 0 ? (
          <p className="text-sm text-muted">
            No peers yet. As more workspaces join the network, matches will appear
            here.
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {data!.peers.map((peer) => (
              <li
                key={peer.workspaceId}
                className="rounded-xl border border-border bg-surface px-4 py-3 text-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-ink">{peer.domain}</span>
                  {peer.domainRating != null && (
                    <span className="text-xs text-muted">DR {peer.domainRating}</span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted">{peer.matchReason}</p>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Request placement" className="mt-6">
        <p className="mb-4 text-sm text-muted">
          Ask a network partner for a contextual link to your site (1 credit). Target
          URL must be on <strong className="text-ink">{workspace.domain}</strong>.
        </p>
        <form onSubmit={submitRequest} className="space-y-4">
          <div>
            <label htmlFor="bl-target" className="block text-sm font-medium text-ink">
              Target page URL
            </label>
            <input
              id="bl-target"
              type="url"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm"
              required
              disabled={!network?.optedIn || submitting}
            />
          </div>
          <div>
            <label htmlFor="bl-anchor" className="block text-sm font-medium text-ink">
              Desired anchor text
            </label>
            <input
              id="bl-anchor"
              type="text"
              value={anchorText}
              onChange={(e) => setAnchorText(e.target.value)}
              placeholder="e.g. best GEO audit tool"
              className="mt-1 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm"
              required
              disabled={!network?.optedIn || submitting}
            />
          </div>
          <div>
            <label htmlFor="bl-note" className="block text-sm font-medium text-ink">
              Context <span className="font-normal text-muted">(optional)</span>
            </label>
            <textarea
              id="bl-note"
              value={contextNote}
              onChange={(e) => setContextNote(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm"
              disabled={!network?.optedIn || submitting}
            />
          </div>
          {data && data.peers.length > 0 && (
            <div>
              <label htmlFor="bl-partner" className="block text-sm font-medium text-ink">
                Preferred partner <span className="font-normal text-muted">(optional)</span>
              </label>
              <select
                id="bl-partner"
                value={preferredPartnerId}
                onChange={(e) => setPreferredPartnerId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm"
                disabled={!network?.optedIn || submitting}
              >
                <option value="">Auto-match best peer</option>
                {data.peers.map((p) => (
                  <option key={p.workspaceId} value={p.workspaceId}>
                    {p.domain}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            type="submit"
            disabled={!network?.optedIn || submitting || creditsLeft < 1}
            className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-white hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Request placement (1 credit)"}
          </button>
          {!network?.optedIn && (
            <p className="text-xs text-muted">Join the network above to enable requests.</p>
          )}
        </form>
      </Panel>

      <Panel title="Placements" className="mt-6">
        {(data?.placements.length ?? 0) === 0 ? (
          <p className="text-sm text-muted">No placements yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {data!.placements.map((p) => (
              <li
                key={p.id}
                className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 lg:flex-row lg:items-start lg:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase ${statusStyle[p.status]}`}
                    >
                      {statusLabel[p.status]}
                    </span>
                    <span className="text-xs text-muted">
                      {p.role === "incoming" ? "Incoming" : "Outgoing"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-ink">
                    {p.role === "incoming"
                      ? `${p.requesterDomain} → link to you`
                      : `You → ${p.partnerDomain ?? "network queue"}`}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Anchor: {p.anchorText} ·{" "}
                    <Link
                      href={p.targetUrl}
                      className="text-accent hover:underline"
                      target="_blank"
                    >
                      {p.targetUrl}
                    </Link>
                  </p>
                  {p.contextNote && (
                    <p className="mt-1 text-xs text-muted">{p.contextNote}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {p.role === "incoming" && p.status === "pending_partner" && (
                    <>
                      <button
                        type="button"
                        onClick={() => void placementAction(p.id, "accept")}
                        className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => void placementAction(p.id, "decline")}
                        className="rounded-full border border-border px-4 py-2 text-xs font-semibold"
                      >
                        Decline
                      </button>
                    </>
                  )}
                  {p.role === "outgoing" &&
                    (p.status === "accepted" || p.status === "pending_partner") && (
                      <button
                        type="button"
                        onClick={() => void placementAction(p.id, "mark_live")}
                        className="rounded-full border border-border px-4 py-2 text-xs font-semibold"
                      >
                        Mark live
                      </button>
                    )}
                  {p.role === "outgoing" &&
                    ["queued", "pending_partner"].includes(p.status) && (
                      <button
                        type="button"
                        onClick={() => void placementAction(p.id, "cancel")}
                        className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-muted"
                      >
                        Cancel
                      </button>
                    )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
