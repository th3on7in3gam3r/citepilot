"use client";

import { useEffect, useState } from "react";
import { Panel } from "@/components/dashboard/DashboardUI";
import { effectInit } from "@/lib/react/effect-init";

type BrowserScanUsageResponse = {
  ok: boolean;
  dailyCount: number;
  dailyLimit: number;
  monthlyCount: number;
  monthlyLimit: number | null;
  plan: "free" | "pilot" | "fleet";
};

type BrowserScanUsagePanelProps = {
  workspaceId: string;
};

export function BrowserScanUsagePanel({ workspaceId }: BrowserScanUsagePanelProps) {
  const [usage, setUsage] = useState<BrowserScanUsageResponse | null>(null);
  const [loading, setLoading] = useState(true);

  effectInit(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(
          `/api/workspaces/${encodeURIComponent(workspaceId)}/browser-scan-usage`,
          { credentials: "include" },
        );
        if (!res.ok) return;
        const data = (await res.json()) as BrowserScanUsageResponse;
        if (!cancelled) setUsage(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  });

  if (loading) {
    return (
      <Panel title="Usage">
        <div className="h-12 animate-pulse rounded-xl bg-surface" />
      </Panel>
    );
  }

  if (!usage) return null;

  const planLabel =
    usage.plan === "fleet" ? "Fleet" : usage.plan === "pilot" ? "Pilot" : "Free";

  return (
    <Panel title="Usage">
      <div className="space-y-3 text-sm">
        <div>
          <p className="font-semibold text-ink">Browser scans</p>
          {usage.plan === "free" ? (
            <p className="mt-1 text-muted">
              Grok and Google AI Overview scans use browser automation on Pilot and
              Fleet plans.
            </p>
          ) : (
            <p className="mt-1 text-muted">
              Browser scans this month:{" "}
              <span className="font-semibold text-ink">
                {usage.monthlyCount}
                {usage.monthlyLimit !== null ? ` of ${usage.monthlyLimit}` : ""}
              </span>{" "}
              ({planLabel})
            </p>
          )}
        </div>
        {usage.plan !== "free" && (
          <p className="text-xs text-muted">
            Daily limit: {usage.dailyCount} / {usage.dailyLimit} browser scans
            (Grok + Google AI Overviews)
          </p>
        )}
      </div>
    </Panel>
  );
}
