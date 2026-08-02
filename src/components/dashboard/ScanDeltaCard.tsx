"use client";

import Link from "next/link";
import { Panel } from "@/components/dashboard/DashboardUI";
import { ScanDeltaDetailView } from "@/components/dashboard/ScanDeltaDetailView";
import type { ScanDeltaSummary } from "@/lib/audit/scan-delta";

type ScanDeltaCardProps = {
  domain: string;
  scanDelta: ScanDeltaSummary;
};

function formatScanDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "last scan";
  }
}

export function ScanDeltaCard({ domain, scanDelta }: ScanDeltaCardProps) {
  if (!scanDelta.available) {
    return (
      <Panel title="Since your last scan">
        <ScanDeltaDetailView scanDelta={scanDelta} domain={domain} compact />
        <Link
          href="/dashboard/geo-audit"
          className="mt-4 inline-flex rounded-full border border-border bg-white px-4 py-2 text-xs font-semibold text-ink transition hover:bg-surface"
        >
          Open GEO Audit
        </Link>
      </Panel>
    );
  }

  const when = scanDelta.previousScanAt
    ? formatScanDate(scanDelta.previousScanAt)
    : "your prior audit";

  return (
    <Panel title="Since your last scan">
      <p className="text-sm text-muted">
        Compared to {when}. Weekly rescans keep this fresh for Pilot workspaces.
      </p>
      <div className="mt-4">
        <ScanDeltaDetailView scanDelta={scanDelta} domain={domain} compact />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/dashboard/geo-audit#scan-delta"
          className="rounded-full border border-border bg-white px-4 py-2 text-xs font-semibold text-ink transition hover:bg-surface"
        >
          Full breakdown
        </Link>
        <Link
          href="/report/proof"
          className="rounded-full border border-border bg-white px-4 py-2 text-xs font-semibold text-ink transition hover:bg-surface"
        >
          Proof report
        </Link>
      </div>
    </Panel>
  );
}
