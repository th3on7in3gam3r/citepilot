"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import type { HealthPayload } from "@/lib/ops/health-status";

export default function AdminHealthPage() {
  const [health, setHealth] = useState<{
    payload: HealthPayload | null;
    checkedAt: string;
  } | null>(null);
  const [sentry, setSentry] = useState<{
    configured: boolean;
    topErrors: Array<{ title: string; count: number; lastSeen: string }>;
    totalEvents: number | null;
  } | null>(null);
  const [queueDepth, setQueueDepth] = useState(0);
  const [cronErrors, setCronErrors] = useState(0);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/health", { credentials: "include" });
    if (!res.ok) return;
    const data = (await res.json()) as {
      health: { payload: HealthPayload | null; checkedAt: string };
      sentry: {
        configured: boolean;
        topErrors: Array<{ title: string; count: number; lastSeen: string }>;
        totalEvents: number | null;
      };
      queueDepth: number;
      cronErrors: number;
    };
    setHealth(data.health);
    setSentry(data.sentry);
    setQueueDepth(data.queueDepth);
    setCronErrors(data.cronErrors);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const checks = health?.payload?.checks ?? {};

  return (
    <AdminShell activePath="/admin/health">
      <h2 className="font-display text-lg font-bold text-ink">System health</h2>
      <p className="mt-1 text-sm text-muted">
        Full diagnostics · checked {health ? new Date(health.checkedAt).toLocaleString() : "…"}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(checks).map(([key, check]) => (
          <div
            key={key}
            className={`rounded-2xl border p-4 shadow-sm ${
              check.ok
                ? "border-emerald-200 bg-emerald-50"
                : "border-rose-200 bg-rose-50"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">{key}</p>
            <p className="mt-1 font-semibold text-ink">{check.ok ? "Operational" : "Issue"}</p>
            {check.detail && <p className="mt-1 text-xs text-muted">{check.detail}</p>}
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-ink">Background jobs</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>Email queue pending: {queueDepth}</li>
            <li>Cron errors (7d): {cronErrors}</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-ink">Sentry (7d)</h3>
          {!sentry?.configured ? (
            <p className="mt-2 text-sm text-muted">Sentry API not configured.</p>
          ) : (
            <>
              <p className="mt-2 text-sm text-muted">
                Total events: {sentry.totalEvents ?? 0}
              </p>
              {sentry.topErrors.length === 0 ? (
                <p className="mt-2 text-xs text-muted">
                  No unresolved issues in the last 7 days.
                </p>
              ) : (
                <ul className="mt-3 space-y-2 text-sm">
                  {sentry.topErrors.map((issue) => (
                    <li key={issue.title}>
                      <span className="font-medium text-ink">{issue.title}</span>
                      <span className="text-muted">
                        {" "}
                        · {issue.count} · {new Date(issue.lastSeen).toLocaleDateString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
