import type { ReactNode } from "react";

export function DashboardToolbar({
  title,
  count,
  description,
  actions,
  children,
}: {
  title: string;
  count?: number | string;
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="font-display text-lg font-bold text-ink">
            {title}{" "}
            {count != null && (
              <span className="text-base font-semibold text-muted">{count}</span>
            )}
          </h3>
          {description && (
            <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

export function DashboardFilterTabs<T extends string>({
  items,
  value,
  onChange,
}: {
  items: { id: T; label: string; count?: number | string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div
      className="inline-flex flex-wrap gap-1 rounded-lg border border-border bg-[var(--dashboard-bg)] p-1 dark:bg-[#141414]"
      role="tablist"
      aria-label="Filter"
    >
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              active
                ? "bg-card text-ink shadow-sm dark:bg-[#111]"
                : "text-muted hover:text-ink"
            }`}
          >
            {item.label}
            {item.count != null && (
              <span className={`ml-1.5 ${active ? "text-muted" : "text-muted/80"}`}>
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function DashboardFilterBar({
  children,
  actions,
}: {
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card px-4 py-3 dark:border-[#222] dark:bg-[#111] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">{children}</div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function DashboardFilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange?: (value: string) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2 text-xs font-medium text-muted">
      <span className="sr-only">{label}</span>
      <span aria-hidden>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="rounded-lg border border-border bg-card py-1.5 pl-2.5 pr-8 text-xs font-semibold text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 dark:border-[#333] dark:bg-[#111]"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
