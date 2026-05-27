import Link from "next/link";
import { Panel } from "@/components/dashboard/DashboardUI";
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
        <p className="text-sm text-muted">
          Run another citation audit on <strong className="text-ink">{domain}</strong>{" "}
          to see prompt, gap, and score changes here — the same signals we use in
          weekly rescan emails.
        </p>
        <Link
          href="/audit"
          className="mt-4 inline-flex rounded-full border border-border bg-white px-4 py-2 text-xs font-semibold text-ink transition hover:bg-surface"
        >
          Run audit
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

      {scanDelta.chips.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-2">
          {scanDelta.chips.map((chip) => {
            const negative =
              chip.startsWith("−") ||
              (chip.startsWith("-") && !chip.startsWith("+"));
            const positive = chip.startsWith("+");
            return (
              <li
                key={chip}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  negative
                    ? "bg-red-50 text-red-800"
                    : positive
                      ? "bg-emerald-50 text-emerald-800"
                      : "bg-surface text-ink"
                }`}
              >
                {chip}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-ink">No material changes vs the prior scan.</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        {scanDelta.promptsWon > 0 && (
          <span className="text-muted">
            +{scanDelta.promptsWon} prompt
            {scanDelta.promptsWon === 1 ? "" : "s"} gained
          </span>
        )}
        {scanDelta.promptsLost > 0 && (
          <span className="text-muted">
            {scanDelta.promptsWon > 0 ? " · " : ""}
            {scanDelta.promptsLost} lost
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/dashboard/geo-audit"
          className="rounded-full border border-border bg-white px-4 py-2 text-xs font-semibold text-ink transition hover:bg-surface"
        >
          Review gaps
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
