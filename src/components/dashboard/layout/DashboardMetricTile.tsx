import Link from "next/link";
import type { ReactNode } from "react";
import { DashboardSparkline } from "@/components/charts/DashboardCharts";

type MetricTheme = "sky" | "violet" | "emerald" | "rose" | "neutral";

const themeStyles: Record<
  MetricTheme,
  { bar: string; badge: string; value: string }
> = {
  sky: {
    bar: "bg-sky-500",
    badge: "bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900/50",
    value: "text-sky-700 dark:text-sky-300",
  },
  violet: {
    bar: "bg-violet-500",
    badge: "bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-900/50",
    value: "text-ink",
  },
  emerald: {
    bar: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50",
    value: "text-ink",
  },
  rose: {
    bar: "bg-rose-500",
    badge: "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50",
    value: "text-rose-700 dark:text-rose-300",
  },
  neutral: {
    bar: "bg-accent",
    badge: "bg-surface text-muted border-border",
    value: "text-ink",
  },
};

export function DashboardMetricTile({
  label,
  value,
  delta,
  href,
  theme = "neutral",
  spark,
  sparkColor,
  footer,
  className = "",
}: {
  label: string;
  value: string | number;
  delta?: string;
  href?: string;
  theme?: MetricTheme;
  spark?: number[];
  sparkColor?: string;
  footer?: ReactNode;
  className?: string;
}) {
  const styles = themeStyles[theme];

  const body = (
    <>
      <div className={`absolute inset-x-0 top-0 h-[3px] ${styles.bar}`} aria-hidden />
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
          {label}
        </span>
        {delta && (
          <span
            className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-bold ${styles.badge}`}
          >
            {delta}
          </span>
        )}
      </div>
      <p className={`mt-3 font-display text-3xl font-extrabold tracking-tight ${styles.value}`}>
        {value}
      </p>
      {footer && (
        <div className="mt-3 min-h-[2rem] border-t border-border/60 pt-2 text-[11px] text-muted">
          {footer}
        </div>
      )}
      {spark && spark.length > 0 && (
        <div className="mt-3 border-t border-border/60 pt-3">
          <DashboardSparkline
            values={spark}
            color={sparkColor ?? "#0ea5e9"}
            className="h-7 w-full"
          />
        </div>
      )}
    </>
  );

  const shellClass = `group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-md dark:border-[#222] dark:bg-[#111] ${className}`;

  if (href) {
    return (
      <Link
        href={href}
        className={`${shellClass} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2`}
        aria-label={`${label}: ${value}`}
      >
        {body}
      </Link>
    );
  }

  return <div className={shellClass}>{body}</div>;
}
