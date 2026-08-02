"use client";

import type { ScanDeltaSummary } from "@/lib/audit/scan-delta";
import { Panel } from "@/components/dashboard/DashboardUI";
import { ScanDeltaDetailView } from "@/components/dashboard/ScanDeltaDetailView";

function formatScanDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "last scan";
  }
}

export function GeoAuditScanDelta({
  domain,
  scanDelta,
}: {
  domain: string;
  scanDelta: ScanDeltaSummary;
}) {
  const when = scanDelta.previousScanAt
    ? formatScanDate(scanDelta.previousScanAt)
    : null;

  return (
    <Panel title="Since your last scan" className="mt-6" id="scan-delta">
      {when ? (
        <p className="text-sm text-muted">
          Comparing this scan to your audit from <strong className="text-ink">{when}</strong>.
          Technical changes show up immediately; AI citation changes can take longer.
        </p>
      ) : (
        <p className="text-sm text-muted">
          Re-run once more to unlock a line-by-line diff of scores, gaps, and prompt citations.
        </p>
      )}
      <div className="mt-4">
        <ScanDeltaDetailView scanDelta={scanDelta} domain={domain} />
      </div>
    </Panel>
  );
}
