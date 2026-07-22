import Link from "next/link";
import type { ReactNode } from "react";

const secondaryClass =
  "inline-flex rounded-full border border-border bg-white px-6 py-3 text-sm font-semibold text-ink transition hover:border-accent/40";

type Props = {
  title: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  /** When set, secondary is a button (e.g. open workspace wizard) instead of a link. */
  onSecondaryClick?: () => void;
  footer?: ReactNode;
  icon?: ReactNode;
};

/** Shared empty-state shell for dashboard surfaces. */
export function DashboardEmptyState({
  title,
  description,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  onSecondaryClick,
  footer,
  icon,
}: Props) {
  const showSecondary =
    Boolean(secondaryLabel) &&
    (Boolean(onSecondaryClick) || Boolean(secondaryHref));

  return (
    <div className="rounded-2xl border border-accent/25 bg-gradient-to-br from-accent/[0.06] via-white to-white p-8 text-center shadow-sm md:p-12">
      <div
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/20 to-glow/10 text-3xl text-accent"
        aria-hidden
      >
        {icon ?? "◎"}
      </div>
      <h2 className="font-display mt-6 text-2xl font-bold text-ink md:text-3xl">
        {title}
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted md:text-base">
        {description}
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href={primaryHref}
          className="inline-flex rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-deep"
        >
          {primaryLabel}
        </Link>
        {showSecondary && secondaryLabel ? (
          onSecondaryClick ? (
            <button
              type="button"
              onClick={onSecondaryClick}
              className={secondaryClass}
            >
              {secondaryLabel}
            </button>
          ) : secondaryHref ? (
            <Link href={secondaryHref} className={secondaryClass}>
              {secondaryLabel}
            </Link>
          ) : null
        ) : null}
      </div>
      {footer ? <div className="mt-6">{footer}</div> : null}
    </div>
  );
}
