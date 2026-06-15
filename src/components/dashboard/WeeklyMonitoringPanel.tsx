"use client";

import { FeatureGate } from "@/components/billing/FeatureGate";
import { ScanDeltaCard } from "@/components/dashboard/ScanDeltaCard";
import { useBilling } from "@/contexts/BillingContext";
import type { WorkspaceSnapshot } from "@/lib/dashboard";
import { emptyScanDeltaSummary } from "@/lib/audit/scan-delta";

const HIGHLIGHTS = [
  "Automatic Monday re-scans across 8 AI platforms",
  "Citation delta chips and weekly lift metrics",
  "Email alerts when competitors gain ground",
] as const;

export function WeeklyMonitoringPanel({ workspace }: { workspace: WorkspaceSnapshot }) {
  const { isPaid, ready } = useBilling();

  if (!ready) {
    return (
      <div className="h-36 animate-pulse rounded-2xl border border-border bg-surface" />
    );
  }

  if (!isPaid) {
    return (
      <FeatureGate
        feature="weekly_monitoring"
        title="Weekly monitoring"
        description="Re-scan your prompts every week and track citation delta over time — the same signals Pilot customers get in Monday digest emails."
        cta="Upgrade to Pilot →"
        highlights={HIGHLIGHTS}
      />
    );
  }

  return (
    <ScanDeltaCard
      domain={workspace.domain}
      scanDelta={workspace.scanDelta ?? emptyScanDeltaSummary}
    />
  );
}
