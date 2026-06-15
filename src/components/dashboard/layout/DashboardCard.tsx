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
  accent = "default",
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
      className={`group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-[#222] dark:bg-[#111] dark:shadow-black/20 dark:hover:shadow-black/30 ${className}`}
    >
      {accent !== "none" && (
        <div
          className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${accentColors[accent]}`}
          aria-hidden
        />
      )}

      {(title || action || dataStatus) && (
        <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-[14px] dark:border-[#222]">
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
              className="text-xs font-medium text-muted transition-colors hover:text-accent"
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
