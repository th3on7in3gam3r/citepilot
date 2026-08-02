import type { DataStatus } from "@/lib/dashboard-data-status";
import { DATA_STATUS_LABEL } from "@/lib/dashboard-data-status";

const STYLES: Record<DataStatus, string> = {
  live: "border-[#bae6fd] bg-[#e0f2fe] text-[#0284c7]",
  estimated: "border-amber-200 bg-amber-50 text-amber-700",
  demo: "border-[#e2e8f0] bg-[#f8fafb] text-[#94a3b8]",
};

export function DataStatusBadge({
  status,
  className = "",
}: {
  status: DataStatus;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STYLES[status]} ${className}`}
      title={
        status === "live"
          ? "Measured from your connected data or saved audits"
          : status === "estimated"
            ? "Derived from workspace signals — not a direct API feed"
            : "Placeholder until you run an audit or connect a data source"
      }
    >
      {status === "live" && (
        <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0ea5e9] opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#0ea5e9]" />
        </span>
      )}
      {DATA_STATUS_LABEL[status]}
    </span>
  );
}
