import type { ReactNode } from "react";

export function DashboardTable({
  children,
  minWidth = "640px",
  className = "",
}: {
  children: ReactNode;
  minWidth?: string;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-border bg-card dark:border-[#222] dark:bg-[#111] ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm" style={{ minWidth }}>
          {children}
        </table>
      </div>
    </div>
  );
}

export function DashboardTableHead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-border bg-[var(--dashboard-bg)] text-xs font-semibold uppercase tracking-wide text-muted dark:bg-[#141414]">
      {children}
    </thead>
  );
}

export function DashboardTableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-border">{children}</tbody>;
}

export function DashboardTableRow({
  children,
  highlight = false,
  header = false,
  className = "",
}: {
  children: ReactNode;
  highlight?: boolean;
  header?: boolean;
  className?: string;
}) {
  if (header) {
    return <tr className={className}>{children}</tr>;
  }

  return (
    <tr
      className={`transition-colors ${
        highlight
          ? "bg-accent/5 dark:bg-accent/10"
          : "bg-card hover:bg-surface/80 dark:bg-[#111] dark:hover:bg-[#161616]"
      } ${className}`}
    >
      {children}
    </tr>
  );
}

export function DashboardTableTh({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <th className={`px-4 py-3 font-semibold ${className}`}>{children}</th>;
}

export function DashboardTableTd({
  children,
  className = "",
  colSpan,
}: {
  children: ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td colSpan={colSpan} className={`px-4 py-3 align-middle ${className}`}>
      {children}
    </td>
  );
}
