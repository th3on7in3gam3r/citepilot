import {
  DashboardPrimaryCta,
  DashboardPrimaryCtaButton,
  DashboardSecondaryCta,
} from "@/components/dashboard/layout/DashboardCta";

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
  return (
    <div className="dash-activation-strip">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="font-display text-lg font-bold text-ink">{title}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {onPrimaryClick ? (
            <DashboardPrimaryCtaButton
              onClick={onPrimaryClick}
              disabled={primaryDisabled}
              size="sm"
            >
              {primaryLabel}
            </DashboardPrimaryCtaButton>
          ) : primaryHref ? (
            <DashboardPrimaryCta href={primaryHref} size="sm">
              {primaryLabel}
            </DashboardPrimaryCta>
          ) : null}
          {secondaryHref && secondaryLabel ? (
            <DashboardSecondaryCta href={secondaryHref} size="sm">
              {secondaryLabel}
            </DashboardSecondaryCta>
          ) : null}
        </div>
      </div>
    </div>
  );
}
