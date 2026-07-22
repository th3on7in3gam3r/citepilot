import type { ReactNode } from "react";
import {
  DashboardPrimaryCta,
  DashboardPrimaryCtaButton,
  DashboardSecondaryCta,
  DashboardSecondaryCtaButton,
} from "@/components/dashboard/layout/DashboardCta";

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
    <div className="dash-empty-state shadow-sm">
      <div className="dash-empty-state__icon" aria-hidden>
        {icon ?? "◎"}
      </div>
      <h2 className="font-display mt-6 text-2xl font-bold text-ink md:text-3xl">
        {title}
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted md:text-base">
        {description}
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <DashboardPrimaryCta href={primaryHref} size="lg">
          {primaryLabel}
        </DashboardPrimaryCta>
        {showSecondary && secondaryLabel ? (
          onSecondaryClick ? (
            <DashboardSecondaryCtaButton onClick={onSecondaryClick} size="lg">
              {secondaryLabel}
            </DashboardSecondaryCtaButton>
          ) : secondaryHref ? (
            <DashboardSecondaryCta href={secondaryHref} size="lg">
              {secondaryLabel}
            </DashboardSecondaryCta>
          ) : null
        ) : null}
      </div>
      {footer ? <div className="mt-6">{footer}</div> : null}
    </div>
  );
}
