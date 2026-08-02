import type { ReactNode } from "react";

export function DashboardPageHeader({
  title,
  description,
  action,
  headingLevel = "h2",
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  headingLevel?: "h1" | "h2";
}) {
  const Heading = headingLevel;
  const titleClass =
    headingLevel === "h1"
      ? "text-xl font-semibold tracking-tight text-ink md:text-2xl"
      : "text-lg font-semibold tracking-tight text-ink";

  return (
    <div className="mb-6 flex flex-col gap-4 border-b border-[var(--dashboard-sidebar-border)] pb-6 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <Heading className={titleClass}>{title}</Heading>
        {description && (
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
            {description}
          </p>
        )}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
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
    <div className="dash-content-card p-5 transition-shadow hover:shadow-md">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-ink">
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
  id,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={`dash-content-card p-6 ${id ? "scroll-mt-24" : ""} ${className}`}
    >
      {title && (
        <h2 className="mb-4 text-sm font-semibold text-ink">{title}</h2>
      )}
      {children}
    </section>
  );
}
