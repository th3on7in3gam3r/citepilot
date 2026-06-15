"use client";

import { useCallback, useEffect, useState } from "react";
import type { PublicServiceStatus } from "@/lib/ops/health-status";

type StatusApiResponse = {
  checkedAt: string;
  services: PublicServiceStatus[];
  degraded: boolean;
};

function statusLabel(status: PublicServiceStatus["status"]): string {
  switch (status) {
    case "operational":
      return "Operational";
    case "degraded":
      return "Degraded";
    case "outage":
      return "Outage";
    default:
      return "Unknown";
  }
}

function statusDotClass(status: PublicServiceStatus["status"]): string {
  switch (status) {
    case "operational":
      return "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.55)]";
    case "degraded":
      return "bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.5)]";
    case "outage":
      return "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.55)]";
    default:
      return "bg-slate-400";
  }
}

function secondsAgo(iso: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
}

export function StatusPageClient({
  initial,
}: {
  initial: StatusApiResponse;
}) {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/status", { cache: "no-store" });
      if (!res.ok) return;
      const next = (await res.json()) as StatusApiResponse;
      setData(next);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      void refresh();
    }, 60_000);
    return () => window.clearInterval(id);
  }, [refresh]);

  const [, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const ago = secondsAgo(data.checkedAt);

  return (
    <div>
      {data.degraded && (
        <div
          className="mb-8 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
          role="status"
        >
          Some features may be degraded. We&apos;re investigating.
        </div>
      )}

      <ul className="space-y-3">
        {data.services.map((service) => (
          <li
            key={service.id}
            className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4"
          >
            <span
              className={`mt-1.5 h-3 w-3 shrink-0 rounded-full ${statusDotClass(service.status)}`}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <p className="font-semibold text-white">{service.label}</p>
                <span className="text-xs font-medium uppercase tracking-wide text-white/45">
                  {statusLabel(service.status)}
                </span>
              </div>
              {service.detail && (
                <p className="mt-1 text-sm text-white/50">{service.detail}</p>
              )}
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-sm text-white/40">
        Last checked: {ago} second{ago === 1 ? "" : "s"} ago
        {loading ? " · Updating…" : ""}
      </p>
    </div>
  );
}
