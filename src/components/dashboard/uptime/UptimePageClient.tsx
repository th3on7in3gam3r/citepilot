"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardPageHeader, Panel, StatCard } from "@/components/dashboard/DashboardUI";
import { DashboardNoWorkspaceEmpty } from "@/components/dashboard/layout/DashboardNoWorkspaceEmpty";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import type {
  AuthType,
  MonitorStatus,
  MonitorType,
  UptimeMonitor,
} from "@/lib/uptime/types";
import { MONITOR_INTERVALS } from "@/lib/uptime/types";

type MonitorForm = {
  name: string;
  monitorType: MonitorType;
  url: string;
  method: string;
  intervalSeconds: number;
  keyword: string;
  keywordPresent: boolean;
  port: string;
  cronJobName: string;
  sslWarnDays: number;
  authType: AuthType;
  authUsername: string;
  authPassword: string;
  authToken: string;
  authJwtHeader: string;
  headersText: string;
};

const TYPE_LABELS: Record<MonitorType, string> = {
  http: "HTTP",
  ping: "Ping (HEAD)",
  keyword: "Keyword",
  ssl: "SSL certificate",
  port: "TCP port",
  cron: "Cron / job health",
};

const STATUS_DOT: Record<MonitorStatus, string> = {
  up: "bg-mint",
  down: "bg-red-500",
  degraded: "bg-amber-500",
  unknown: "bg-muted",
};

const DEFAULT_FORM: MonitorForm = {
  name: "",
  monitorType: "http",
  url: "",
  method: "GET",
  intervalSeconds: 300,
  keyword: "",
  keywordPresent: true,
  port: "",
  cronJobName: "",
  sslWarnDays: 14,
  authType: "none",
  authUsername: "",
  authPassword: "",
  authToken: "",
  authJwtHeader: "Authorization",
  headersText: "",
};

function parseHeaders(text: string): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const idx = line.indexOf(":");
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (key) headers[key] = value;
  }
  return headers;
}

function formatWhen(iso: string | null): string {
  if (!iso) return "Never";
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function UptimePageClient() {
  const { workspace, ready } = useWorkspaceContext();
  const workspaceId = workspace?.workspaceId ?? workspace?.id ?? "";

  const [monitors, setMonitors] = useState<UptimeMonitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<MonitorForm>(DEFAULT_FORM);

  const load = useCallback(async () => {
    if (!workspaceId) {
      setMonitors([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/uptime/monitors?workspaceId=${encodeURIComponent(workspaceId)}`,
        { credentials: "include" },
      );
      const data = (await res.json()) as {
        monitors?: UptimeMonitor[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Failed to load monitors");
      setMonitors(data.monitors ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load monitors");
      setMonitors([]);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (ready) void load();
  }, [ready, load]);

  const stats = useMemo(() => {
    const up = monitors.filter((m) => m.lastStatus === "up").length;
    const down = monitors.filter((m) => m.lastStatus === "down").length;
    const degraded = monitors.filter((m) => m.lastStatus === "degraded").length;
    return { up, down, degraded, total: monitors.length };
  }, [monitors]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!workspaceId) return;
    setSaving(true);
    setError(null);

    const auth =
      form.authType === "basic" || form.authType === "digest"
        ? {
            username: form.authUsername.trim(),
            password: form.authPassword,
          }
        : form.authType === "jwt"
          ? {
              token: form.authToken.trim(),
              jwtHeader: form.authJwtHeader.trim() || "Authorization",
            }
          : undefined;

    try {
      const res = await fetch("/api/uptime/monitors", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          name: form.name,
          monitorType: form.monitorType,
          url: form.url,
          method: form.method,
          intervalSeconds: form.intervalSeconds,
          keyword: form.monitorType === "keyword" ? form.keyword : undefined,
          keywordPresent: form.keywordPresent,
          port: form.port ? Number(form.port) : undefined,
          cronJobName: form.cronJobName || undefined,
          sslWarnDays: form.sslWarnDays,
          authType: form.authType,
          auth,
          headers: parseHeaders(form.headersText),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to create monitor");
      setForm(DEFAULT_FORM);
      setShowForm(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create monitor");
    } finally {
      setSaving(false);
    }
  }

  async function runCheck(id: string) {
    setCheckingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/uptime/monitors/${id}/check`, {
        method: "POST",
        credentials: "include",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Check failed");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Check failed");
    } finally {
      setCheckingId(null);
    }
  }

  async function toggleMonitor(monitor: UptimeMonitor) {
    const res = await fetch(`/api/uptime/monitors/${monitor.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !monitor.enabled }),
    });
    if (res.ok) await load();
  }

  async function deleteMonitor(id: string) {
    if (!confirm("Delete this monitor?")) return;
    const res = await fetch(`/api/uptime/monitors/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) await load();
  }

  if (!ready) {
    return <div className="h-64 animate-pulse rounded-2xl bg-surface" />;
  }

  if (!workspaceId) {
    return (
      <DashboardNoWorkspaceEmpty description="Create a workspace to monitor endpoints, SSL, and cron health." />
    );
  }

  return (
    <div className="dash-page">
      <DashboardPageHeader
        title="Uptime monitors"
        description="Monitor HTTP endpoints, SSL certificates, TCP ports, keywords in API responses, and cron job health. Checks run every few minutes with alerts via Slack and webhooks."
        action={
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-deep"
          >
            {showForm ? "Cancel" : "Add monitor"}
          </button>
        }
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Monitors" value={String(stats.total)} />
        <StatCard label="Up" value={String(stats.up)} sub="" trend={stats.up > 0 ? "Healthy" : undefined} />
        <StatCard label="Down" value={String(stats.down)} />
        <StatCard label="Degraded" value={String(stats.degraded)} sub="SSL warnings" />
      </div>

      {error && (
        <p className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </p>
      )}

      {showForm && (
        <Panel title="New monitor" className="mb-8">
          <form onSubmit={(e) => void handleCreate(e)} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm">
                <span className="font-medium text-ink">Name</span>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2.5 dark:border-[#333] dark:bg-[#111]"
                  placeholder="Production API"
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-ink">Type</span>
                <select
                  value={form.monitorType}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      monitorType: e.target.value as MonitorType,
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2.5 dark:border-[#333] dark:bg-[#111]"
                >
                  {(Object.keys(TYPE_LABELS) as MonitorType[]).map((t) => (
                    <option key={t} value={t}>
                      {TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block text-sm">
              <span className="font-medium text-ink">URL / host</span>
              <input
                required
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2.5 font-mono text-sm dark:border-[#333] dark:bg-[#111]"
                placeholder="https://api.example.com/health"
              />
            </label>

            {(form.monitorType === "http" ||
              form.monitorType === "keyword" ||
              form.monitorType === "cron") && (
              <label className="block text-sm">
                <span className="font-medium text-ink">HTTP method</span>
                <select
                  value={form.method}
                  onChange={(e) => setForm({ ...form, method: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2.5 dark:border-[#333] dark:bg-[#111]"
                >
                  {["GET", "HEAD", "POST", "PUT", "PATCH"].map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {form.monitorType === "keyword" && (
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm">
                  <span className="font-medium text-ink">Keyword</span>
                  <input
                    required
                    value={form.keyword}
                    onChange={(e) =>
                      setForm({ ...form, keyword: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2.5 dark:border-[#333] dark:bg-[#111]"
                    placeholder="ok"
                  />
                </label>
                <label className="flex items-end gap-2 pb-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.keywordPresent}
                    onChange={(e) =>
                      setForm({ ...form, keywordPresent: e.target.checked })
                    }
                  />
                  Keyword must be present in response
                </label>
              </div>
            )}

            {form.monitorType === "port" && (
              <label className="block text-sm">
                <span className="font-medium text-ink">Port</span>
                <input
                  type="number"
                  min={1}
                  max={65535}
                  value={form.port}
                  onChange={(e) => setForm({ ...form, port: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2.5 dark:border-[#333] dark:bg-[#111]"
                  placeholder="443"
                />
              </label>
            )}

            {form.monitorType === "cron" && (
              <label className="block text-sm">
                <span className="font-medium text-ink">Cron job name (optional)</span>
                <input
                  value={form.cronJobName}
                  onChange={(e) =>
                    setForm({ ...form, cronJobName: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2.5 dark:border-[#333] dark:bg-[#111]"
                  placeholder="weekly-digest"
                />
                <span className="mt-1 block text-xs text-muted">
                  Cross-checks CitePilot cron_dispatch_log when set.
                </span>
              </label>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm">
                <span className="font-medium text-ink">Check interval</span>
                <select
                  value={form.intervalSeconds}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      intervalSeconds: Number(e.target.value),
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2.5 dark:border-[#333] dark:bg-[#111]"
                >
                  {MONITOR_INTERVALS.map((sec) => (
                    <option key={sec} value={sec}>
                      {sec < 3600 ? `${sec / 60} min` : `${sec / 3600} hr`}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="font-medium text-ink">Auth</span>
                <select
                  value={form.authType}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      authType: e.target.value as AuthType,
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2.5 dark:border-[#333] dark:bg-[#111]"
                >
                  <option value="none">None</option>
                  <option value="basic">Basic</option>
                  <option value="digest">Digest</option>
                  <option value="jwt">JWT / Bearer</option>
                </select>
              </label>
            </div>

            {(form.authType === "basic" || form.authType === "digest") && (
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm">
                  <span className="font-medium text-ink">Username</span>
                  <input
                    value={form.authUsername}
                    onChange={(e) =>
                      setForm({ ...form, authUsername: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2.5 dark:border-[#333] dark:bg-[#111]"
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-ink">Password</span>
                  <input
                    type="password"
                    value={form.authPassword}
                    onChange={(e) =>
                      setForm({ ...form, authPassword: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2.5 dark:border-[#333] dark:bg-[#111]"
                  />
                </label>
              </div>
            )}

            {form.authType === "jwt" && (
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm md:col-span-2">
                  <span className="font-medium text-ink">Token</span>
                  <input
                    type="password"
                    value={form.authToken}
                    onChange={(e) =>
                      setForm({ ...form, authToken: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2.5 font-mono text-sm dark:border-[#333] dark:bg-[#111]"
                    placeholder="Bearer eyJ..."
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-ink">Header name</span>
                  <input
                    value={form.authJwtHeader}
                    onChange={(e) =>
                      setForm({ ...form, authJwtHeader: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2.5 dark:border-[#333] dark:bg-[#111]"
                  />
                </label>
              </div>
            )}

            <label className="block text-sm">
              <span className="font-medium text-ink">Custom headers</span>
              <textarea
                value={form.headersText}
                onChange={(e) =>
                  setForm({ ...form, headersText: e.target.value })
                }
                rows={3}
                className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2.5 font-mono text-sm dark:border-[#333] dark:bg-[#111]"
                placeholder={"X-Api-Key: your-key\nAccept: application/json"}
              />
            </label>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-deep disabled:opacity-60"
            >
              {saving ? "Creating…" : "Create monitor"}
            </button>
          </form>
        </Panel>
      )}

      <Panel title="Active monitors">
        {loading ? (
          <p className="text-sm text-muted">Loading monitors…</p>
        ) : monitors.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-6 py-10 text-center dark:border-[#333]">
            <p className="font-medium text-ink">No monitors yet</p>
            <p className="mt-2 text-sm text-muted">
              Add an HTTP, keyword, SSL, port, or cron monitor for your API
              endpoints. Alerts flow to{" "}
              <Link href="/dashboard/alerts" className="text-accent hover:underline">
                Alerts
              </Link>
              , Slack, and webhooks.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {monitors.map((monitor) => (
              <article
                key={monitor.id}
                className="rounded-xl border border-border bg-surface/50 p-4 dark:border-[#333] dark:bg-[#0f0f0f]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${STATUS_DOT[monitor.lastStatus]}`}
                        aria-hidden
                      />
                      <h3 className="font-display font-bold text-ink">
                        {monitor.name}
                      </h3>
                      <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted dark:border-[#333]">
                        {TYPE_LABELS[monitor.monitorType]}
                      </span>
                      {!monitor.enabled && (
                        <span className="text-xs text-muted">Paused</span>
                      )}
                    </div>
                    <p className="mt-1 truncate font-mono text-xs text-muted">
                      {monitor.url}
                    </p>
                    <p className="mt-2 text-sm text-muted">
                      {monitor.lastError ?? "OK"}
                      {monitor.lastLatencyMs != null && (
                        <> · {monitor.lastLatencyMs}ms</>
                      )}
                      {monitor.lastCheckedAt && (
                        <> · checked {formatWhen(monitor.lastCheckedAt)}</>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void runCheck(monitor.id)}
                      disabled={checkingId === monitor.id}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-accent dark:border-[#333]"
                    >
                      {checkingId === monitor.id ? "Checking…" : "Check now"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void toggleMonitor(monitor)}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted transition hover:text-ink dark:border-[#333]"
                    >
                      {monitor.enabled ? "Pause" : "Resume"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteMonitor(monitor.id)}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:border-red-300 dark:border-[#333]"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
