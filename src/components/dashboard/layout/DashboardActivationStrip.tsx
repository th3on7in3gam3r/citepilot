import Link from "next/link";

type Props = {
  title: string;
  description: string;
  primaryHref?: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  onPrimaryClick?: () => void;
  primaryDisabled?: boolean;
};

/**
 * Pre-audit / thin-data activation card — one headline, why-line, primary CTA.
 * Used across left-nav routes so pages never feel like a blank shell.
 */
export function DashboardActivationStrip({
  title,
  description,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  onPrimaryClick,
  primaryDisabled,
}: Props) {
  const primaryClass =
    "inline-flex shrink-0 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-deep disabled:opacity-60";

  return (
    <div className="mb-6 rounded-2xl border border-l-4 border-border border-l-accent bg-card p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="font-display text-lg font-bold text-ink">{title}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {onPrimaryClick ? (
            <button
              type="button"
              onClick={onPrimaryClick}
              disabled={primaryDisabled}
              className={primaryClass}
            >
              {primaryLabel}
            </button>
          ) : primaryHref ? (
            <Link href={primaryHref} className={primaryClass}>
              {primaryLabel}
            </Link>
          ) : null}
          {secondaryHref && secondaryLabel ? (
            <Link
              href={secondaryHref}
              className="inline-flex rounded-full border border-border bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-accent/40"
            >
              {secondaryLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
