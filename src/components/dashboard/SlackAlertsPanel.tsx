"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { FeatureGate } from "@/components/billing/FeatureGate";
import { useBilling } from "@/contexts/BillingContext";
import { useToast } from "@/components/notifications/ToastProvider";

type SlackChannel = {
  id: string;
  name: string;
  isPrivate: boolean;
};

type SlackAlertsPanelProps = {
  workspaceId: string;
  /** When true, omit outer card chrome (for Integrations page grid). */
  embedded?: boolean;
};

export function SlackAlertsPanel({ workspaceId, embedded = false }: SlackAlertsPanelProps) {
  const { isPaid, ready } = useBilling();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [savingChannel, setSavingChannel] = useState(false);
  const [connected, setConnected] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [teamName, setTeamName] = useState<string | null>(null);
  const [channelId, setChannelId] = useState("");
  const [channels, setChannels] = useState<SlackChannel[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/integrations/slack/channels?workspaceId=${encodeURIComponent(workspaceId)}`,
        { credentials: "include" },
      );
      const data = (await res.json()) as {
        connected?: boolean;
        configured?: boolean;
        teamName?: string;
        channelId?: string;
        channels?: SlackChannel[];
        error?: string;
      };
      if (!res.ok) {
        toast.error(data.error ?? "Failed to load Slack");
        return;
      }
      setConfigured(data.configured !== false);
      setConnected(Boolean(data.connected));
      setTeamName(data.teamName ?? null);
      setChannelId(data.channelId ?? "");
      setChannels(data.channels ?? []);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, toast]);

  useEffect(() => {
    if (ready && isPaid) void load();
  }, [ready, isPaid, load]);

  async function connectSlack() {
    setConnecting(true);
    try {
      const res = await fetch(
        `/api/integrations/slack/oauth?workspaceId=${encodeURIComponent(workspaceId)}`,
        { credentials: "include" },
      );
      const data = (await res.json()) as { url?: string; error?: string };
      if (res.status === 503) {
        setConfigured(false);
        toast.error(
          data.error ??
            "Slack is not configured on this server yet. Add SLACK_CLIENT_ID and SLACK_CLIENT_SECRET to your environment.",
        );
        return;
      }
      if (!res.ok || !data.url) {
        toast.error(data.error ?? "Slack OAuth unavailable");
        return;
      }
      window.location.href = data.url;
    } finally {
      setConnecting(false);
    }
  }

  async function saveChannel(nextId: string) {
    const ch = channels.find((c) => c.id === nextId);
    if (!ch) return;
    setSavingChannel(true);
    try {
      const res = await fetch("/api/integrations/slack", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          channelId: ch.id,
          channelName: ch.name,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Failed to save channel");
        return;
      }
      setChannelId(ch.id);
      toast.success(`Alerts will post to #${ch.name}`);
    } finally {
      setSavingChannel(false);
    }
  }

  async function disconnect() {
    const res = await fetch(
      `/api/integrations/slack?workspaceId=${encodeURIComponent(workspaceId)}`,
      { method: "DELETE", credentials: "include" },
    );
    if (!res.ok) {
      toast.error("Failed to disconnect Slack");
      return;
    }
    setConnected(false);
    setTeamName(null);
    setChannelId("");
    setChannels([]);
    toast.success("Slack disconnected");
  }

  if (!ready) {
    return <div className="mt-4 h-24 animate-pulse rounded-xl bg-surface" />;
  }

  if (!isPaid) {
    return (
      <div className={embedded ? "" : "mt-6"}>
        <FeatureGate
          feature="slack_alerts"
          title="Slack alerts"
          description="Post weekly digests and citation changes to a Slack channel — stay top-of-mind without opening the dashboard."
          cta="Upgrade to Pilot →"
          highlights={[
            "Block Kit weekly digest",
            "Real-time citation gain/loss alerts",
            "Channel picker after OAuth",
          ]}
        />
      </div>
    );
  }

  const shellClass = embedded
    ? ""
    : "mt-6 rounded-xl border border-border bg-surface/50 p-4";

  return (
    <div className={shellClass}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {!embedded && <h3 className="text-sm font-semibold text-ink">Slack</h3>}
          <p className={`text-xs text-muted ${embedded ? "" : "mt-1"}`}>
            {connected
              ? "Choose which channel receives citation digests and change alerts."
              : "No email needed — click Connect Slack to sign in with your Slack account and authorize CitePilot."}
          </p>
        </div>
        {!connected && configured && (
          <button
            type="button"
            disabled={connecting || loading}
            onClick={() => void connectSlack()}
            className="rounded-full bg-[#4A154B] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {connecting ? "Redirecting…" : "Connect Slack"}
          </button>
        )}
      </div>

      {!connected && !loading && (
        <ol className="mt-3 list-decimal space-y-1 pl-4 text-xs text-muted">
          <li>Click <strong className="font-semibold text-ink">Connect Slack</strong>.</li>
          <li>Sign in to Slack and approve access for your workspace.</li>
          <li>Return here and pick the channel for alerts.</li>
        </ol>
      )}

      {!connected && !loading && (
        <p className="mt-3 text-xs text-muted">
          Email alerts use the{" "}
          <Link
            href="/dashboard/settings#notifications"
            className="font-semibold text-accent hover:underline"
          >
            monitoring email
          </Link>{" "}
          in Notifications — not your Slack login.
        </p>
      )}

      {!configured && !loading && (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
          Slack OAuth is not set up on this deployment. An admin needs{" "}
          <code className="text-[11px]">SLACK_CLIENT_ID</code> and{" "}
          <code className="text-[11px]">SLACK_CLIENT_SECRET</code> in the server
          environment.
        </p>
      )}

      {loading && (
        <p className="mt-3 text-xs text-muted">Loading Slack status…</p>
      )}

      {!loading && connected && (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-ink">
            Connected to <strong>{teamName ?? "Slack workspace"}</strong>
          </p>
          <label className="block text-sm font-semibold text-ink">
            Post alerts to channel
            <select
              value={channelId}
              disabled={savingChannel || channels.length === 0}
              onChange={(e) => void saveChannel(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-normal text-ink"
            >
              <option value="">Select a channel…</option>
              {channels.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  {ch.isPrivate ? "🔒 " : "#"}
                  {ch.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => void disconnect()}
            className="text-xs font-semibold text-red-600 hover:underline"
          >
            Disconnect Slack
          </button>
        </div>
      )}
    </div>
  );
}
