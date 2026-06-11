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
    <div className="group relative overflow-hidden rounded-2xl border border-[#e8edf3] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.05)] transition-shadow hover:shadow-[0_4px_16px_rgba(15,23,42,0.09)]">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#0ea5e9] to-[#22d3ee] opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#94a3b8]">
        {label}
      </p>
      <p className="font-display mt-2 text-3xl font-bold tracking-tight text-[#0f172a]">
        {value}
        {sub && (
          <span className="ml-1 text-base font-normal text-[#94a3b8]">{sub}</span>
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
      className={`rounded-2xl border border-[#e8edf3] bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,0.05)] ${id ? "scroll-mt-24" : ""} ${className}`}
    >
      {title && (
        <h2 className="mb-4 font-display text-lg font-bold text-[#0f172a]">{title}</h2>
      )}
      {children}
    </section>
  );
}
