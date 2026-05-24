import type { ReactNode } from "react";

export function DashboardPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-muted">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  trend?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
        {label}
      </p>
      <p className="font-display mt-2 text-3xl font-bold text-ink">
        {value}
        {sub && (
          <span className="ml-1 text-base font-normal text-muted">{sub}</span>
        )}
      </p>
      {trend && (
        <p className="mt-2 text-sm font-medium text-mint">{trend}</p>
      )}
    </div>
  );
}

export function Panel({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-border bg-white p-6 shadow-sm ${className}`}
    >
      {title && (
        <h2 className="mb-4 font-display text-lg font-bold text-ink">{title}</h2>
      )}
      {children}
    </section>
  );
}
