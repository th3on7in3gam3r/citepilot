import type { ReactNode } from "react";

export function DashboardPageHeader({
  title,
  description,
  action,
  headingLevel = "h1",
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  headingLevel?: "h1" | "h2";
}) {
  const Heading = headingLevel;

  return (
    <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <Heading className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
          {title}
        </Heading>
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
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md dark:border-[#222] dark:bg-[#111] dark:shadow-black/20 dark:hover:shadow-black/30">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-accent to-glow opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </p>
      <p className="font-display mt-2 text-3xl font-bold tracking-tight text-ink">
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
        <h2 className="mb-4 font-display text-lg font-bold text-ink">{title}</h2>
      )}
      {children}
    </section>
  );
}
