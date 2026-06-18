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
  accent = "none",
}: {
  title?: string;
  action?: string;
  actionHref?: string;
  dataStatus?: DataStatus;
  children: ReactNode;
  className?: string;
  accent?: "default" | "blue" | "amber" | "mint" | "none";
}) {
  const accentColors: Record<string, string> = {
    default: "from-[#0ea5e9] via-[#22d3ee] to-[#10b981]",
    blue: "from-[#0ea5e9] to-[#6366f1]",
    amber: "from-[#f59e0b] to-[#fb923c]",
    mint: "from-[#10b981] to-[#22d3ee]",
    none: "",
  };

  return (
    <section
      className={`dash-content-card overflow-hidden transition-shadow duration-200 hover:shadow-md dark:border-[#222] dark:bg-[#111] dark:hover:shadow-black/20 ${className}`}
    >
      {accent !== "none" && (
        <div
          className={`h-[3px] bg-gradient-to-r ${accentColors[accent]}`}
          aria-hidden
        />
      )}

      {(title || action || dataStatus) && (
        <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4 dark:border-[#222]">
          <div className="flex min-w-0 items-center gap-2">
            {title ? (
              <h2 className="truncate text-sm font-semibold text-ink">{title}</h2>
            ) : (
              <span />
            )}
            {dataStatus && <DataStatusBadge status={dataStatus} />}
          </div>
          {action && actionHref ? (
            <Link
              href={actionHref}
              className="shrink-0 text-xs font-semibold text-accent transition-colors hover:text-accent-deep"
            >
              {action} →
            </Link>
          ) : action ? (
            <span className="text-xs font-medium text-muted">{action}</span>
          ) : null}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}
