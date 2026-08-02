"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardPageHeader, Panel } from "@/components/dashboard/DashboardUI";
import { DashboardActivationStrip } from "@/components/dashboard/layout/DashboardActivationStrip";
import { dashPrimaryCta } from "@/lib/dashboard/surface-classes";
import { DashboardNoWorkspaceEmpty } from "@/components/dashboard/layout/DashboardNoWorkspaceEmpty";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";

type AlertEvent = {
  id: string;
  workspaceId: string;
  domain?: string;
  channel: "email" | "slack" | "webhook";
  eventType: string;
  title: string;
  description?: string | null;
  prompt?: string | null;
  platform?: string | null;
  createdAt: string;
};

const CHANNEL_LABEL: Record<AlertEvent["channel"], string> = {
  email: "Email",
  slack: "Slack",
  webhook: "Webhook",
};

const CHANNEL_STYLE: Record<AlertEvent["channel"], string> = {
  email: "bg-sky-50 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200",
  slack: "bg-violet-50 text-violet-900 dark:bg-violet-950/50 dark:text-violet-200",
  webhook: "bg-amber-50 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200",
};

function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function AlertsPageClient() {
  const { workspace, ready, workspaces } = useWorkspaceContext();
  const [events, setEvents] = useState<AlertEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState("");
  const [workspaceFilter, setWorkspaceFilter] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const activeWorkspaceId = workspace?.workspaceId ?? workspace?.id ?? "";

  useEffect(() => {
    if (activeWorkspaceId && !workspaceFilter) {
      setWorkspaceFilter(activeWorkspaceId);
    }
  }, [activeWorkspaceId, workspaceFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (workspaceFilter) params.set("workspaceId", workspaceFilter);
    if (channel) params.set("channel", channel);
    if (from) params.set("from", new Date(from).toISOString());
    if (to) params.set("to", new Date(`${to}T23:59:59`).toISOString());
    params.set("limit", "100");

    try {
      const res = await fetch(`/api/alerts/history?${params}`, {
        credentials: "include",
      });
      const data = (await res.json()) as { events?: AlertEvent[] };
      setEvents(data.events ?? []);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [workspaceFilter, channel, from, to]);

  useEffect(() => {
    if (ready) void load();
  }, [ready, load]);

  const workspaceOptions = useMemo(() => {
    const list = workspaces?.length
      ? workspaces
      : workspace
        ? [workspace]
        : [];
    return list.map((w) => ({
      id: ("workspaceId" in w && w.workspaceId) || w.id || "",
      domain: w.domain,
    }));
  }, [workspaces, workspace]);

  if (!ready) {
    return <div className="h-64 animate-pulse rounded-2xl bg-surface" />;
  }

  if (!workspace && workspaces.length === 0) {
    return (
      <DashboardNoWorkspaceEmpty description="Create a workspace to view Slack, webhook, and email alert history." />
    );
  }

  return (
    <>
      <DashboardPageHeader
        headingLevel="h2"
        title="Alerts"
        description="Timeline of Slack, webhook, and email alerts sent for your monitored prompts."
        action={
          <Link href="/dashboard/settings#notifications" className={dashPrimaryCta}>
            Notification settings →
          </Link>
        }
      />

      {workspace && !workspace.hasRealAudit && (
        <DashboardActivationStrip
          title="Alerts appear after audits"
          description="Citation drops, competitor gains, and webhook deliveries show up here once you run scans and connect notification channels."
          primaryHref="/dashboard/geo-audit"
          primaryLabel="Run GEO audit →"
          secondaryHref="/dashboard/settings#notifications"
          secondaryLabel="Notification settings"
        />
      )}

      {(loading || events.length > 0) && (
      <Panel title="Filter">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-xs font-semibold text-ink">
            Alert type
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-normal"
            >
              <option value="">All types</option>
              <option value="email">Email</option>
              <option value="slack">Slack</option>
              <option value="webhook">Webhook</option>
            </select>
          </label>
          <label className="block text-xs font-semibold text-ink">
            Workspace
            <select
              value={workspaceFilter}
              onChange={(e) => setWorkspaceFilter(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-normal"
            >
              <option value="">All workspaces</option>
              {workspaceOptions.map((w) =>
                w.id ? (
                  <option key={w.id} value={w.id}>
                    {w.domain}
                  </option>
                ) : null,
              )}
            </select>
          </label>
          <label className="block text-xs font-semibold text-ink">
            From
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-normal"
            />
          </label>
          <label className="block text-xs font-semibold text-ink">
            To
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-normal"
            />
          </label>
        </div>
      </Panel>
      )}

      <Panel title="Alert history" className="mt-6">
        {loading && <p className="text-sm text-muted">Loading alerts…</p>}
        {!loading && events.length === 0 && (
          <div className="rounded-xl border border-dashed border-border px-6 py-10 text-center">
            <p className="font-semibold text-ink">No alerts yet</p>
            <p className="mt-2 text-sm text-muted">
              Alerts fire after citation audits and monitoring rules run.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/dashboard/geo-audit"
                className="inline-flex rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-deep"
              >
                Run GEO audit →
              </Link>
              <Link
                href="/dashboard/settings#notifications"
                className="inline-flex rounded-full border border-border bg-white px-5 py-2.5 text-sm font-semibold text-ink hover:border-accent/40"
              >
                Connect notifications
              </Link>
            </div>
          </div>
        )}
        <ul className="space-y-3">
          {events.map((ev) => (
            <li
              key={ev.id}
              className="flex flex-col gap-2 rounded-xl border border-border px-4 py-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${CHANNEL_STYLE[ev.channel]}`}
                  >
                    {CHANNEL_LABEL[ev.channel]}
                  </span>
                  {ev.domain && (
                    <span className="text-xs text-muted">{ev.domain}</span>
                  )}
                  <time className="text-xs text-muted">{formatWhen(ev.createdAt)}</time>
                </div>
                <p className="mt-2 text-sm font-semibold text-ink">{ev.title}</p>
                {ev.description && (
                  <p className="mt-1 text-sm text-muted">{ev.description}</p>
                )}
              </div>
              {ev.prompt && (
                <Link
                  href="/dashboard/analytics"
                  className="shrink-0 text-xs font-semibold text-accent hover:underline"
                >
                  View prompt →
                </Link>
              )}
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
