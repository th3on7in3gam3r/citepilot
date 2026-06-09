import type { DataStatus } from "@/lib/dashboard-data-status";
import { DATA_STATUS_LABEL } from "@/lib/dashboard-data-status";

const STYLES: Record<DataStatus, string> = {
  live: "border-[#bae6fd] bg-[#e0f2fe] text-[#0284c7]",
  estimated: "border-amber-200 bg-amber-50 text-amber-800",
  demo: "border-[#e2e8f0] bg-[#f8fafb] text-[#64748b]",
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
      className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STYLES[status]} ${className}`}
      title={
        status === "live"
          ? "Measured from your connected data or saved audits"
          : status === "estimated"
            ? "Derived from workspace signals — not a direct API feed"
            : "Placeholder until you run an audit or connect a data source"
      }
    >
      {DATA_STATUS_LABEL[status]}
    </span>
  );
}
