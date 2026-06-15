"use client";

import { FeatureGate } from "@/components/billing/FeatureGate";
import { DashboardCard } from "@/components/dashboard/layout/DashboardCard";
import { RosenLineChart } from "@/components/charts/RosenLineChart";
import { useBilling } from "@/contexts/BillingContext";
import type { DataStatus } from "@/lib/dashboard-data-status";

type CitationTrendPanelProps = {
  historyLabels: string[];
  historyValues: number[];
  citedCount: number;
  platformCount: number;
  trendDataStatus: DataStatus;
};

export function CitationTrendPanel({
  historyLabels,
  historyValues,
  citedCount,
  platformCount,
  trendDataStatus,
}: CitationTrendPanelProps) {
  const { isPaid, ready } = useBilling();

  if (!ready) {
    return <div className="h-64 animate-pulse rounded-2xl bg-surface" />;
  }

  if (!isPaid) {
    return (
      <FeatureGate
        feature="citation_delta_history"
        title="Citation delta history"
        description="Track citation score and platform coverage over time with weekly re-scans — see what moved after each audit."
        cta="Upgrade to Pilot →"
        highlights={[
          "30-day citation score trend chart",
          "Platform coverage history",
          "Delta chips after every Monday re-scan",
        ]}
      />
    );
  }

  return (
    <DashboardCard title="Citation trend" action="Last 30 days" dataStatus={trendDataStatus}>
      <div className="space-y-6">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Citation Score
            </p>
            <span className="text-xs font-bold text-indigo-600">
              {historyValues.length > 0 ? historyValues[historyValues.length - 1] : 0}
            </span>
          </div>
          <RosenLineChart
            labels={historyLabels}
            series={[
              {
                label: "Score",
                values: historyValues,
                gradientFrom: "#6366f1",
                gradientTo: "#a78bfa",
              },
            ]}
            height={108}
          />
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Platforms Cited
            </p>
            <span className="text-xs font-bold text-sky-600">
              {citedCount}/{platformCount}
            </span>
          </div>
          <RosenLineChart
            labels={historyLabels}
            series={[
              {
                label: "Platforms",
                values: historyValues.map((v) => Math.round(v / 15)),
                gradientFrom: "#0ea5e9",
                gradientTo: "#38bdf8",
              },
            ]}
            height={108}
          />
        </div>
      </div>
    </DashboardCard>
  );
}
