import type { ReactNode } from "react";
import Link from "next/link";
import { DataStatusBadge } from "@/components/dashboard/DataStatusBadge";
import type { DataStatus } from "@/lib/dashboard-data-status";

export function DashboardCard({
  title,
  action,
  actionHref,
  dataStatus,
  children,
  className = "",
}: {
  title?: string;
  action?: string;
  actionHref?: string;
  dataStatus?: DataStatus;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-[#e8edf3] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)] ${className}`}
    >
      {(title || action || dataStatus) && (
        <header className="flex items-center justify-between gap-3 border-b border-[#eef2f6] px-5 py-4">
          <div className="flex min-w-0 items-center gap-2">
            {title ? (
              <h2 className="truncate text-sm font-semibold text-[#0f172a]">{title}</h2>
            ) : (
              <span />
            )}
            {dataStatus && <DataStatusBadge status={dataStatus} />}
          </div>
          {action && actionHref ? (
            <Link
              href={actionHref}
              className="text-xs font-medium text-[#64748b] transition hover:text-[#0f172a]"
            >
              {action}
            </Link>
          ) : action ? (
            <span className="text-xs font-medium text-[#64748b]">{action}</span>
          ) : null}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}
