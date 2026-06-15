"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PilotCheckoutButton } from "@/components/billing/PilotCheckoutButton";
import { trackEvent } from "@/lib/analytics/track";

export type FeatureGateProps = {
  /** PostHog / analytics identifier, e.g. `weekly_monitoring` */
  feature: string;
  title: string;
  description: string;
  cta?: string;
  highlights?: readonly string[];
  compact?: boolean;
  className?: string;
};

export function FeatureGate({
  feature,
  title,
  description,
  cta = "Upgrade to Pilot →",
  highlights = [],
  compact = false,
  className = "",
}: FeatureGateProps) {
  const router = useRouter();

  useEffect(() => {
    trackEvent("upgrade_prompt_viewed", { feature });
  }, [feature]);

  function goToPricing() {
    trackEvent("upgrade_prompt_clicked", { feature, destination: "pricing" });
    router.push("/pricing");
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-accent/25 bg-gradient-to-br from-accent/[0.07] via-card to-card dark:border-accent/20 dark:from-accent/10 dark:via-[#111] dark:to-[#111] ${
        compact ? "px-4 py-4" : "px-5 py-5 sm:px-6 sm:py-6"
      } ${className}`}
      data-feature-gate={feature}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-accent/10 blur-2xl"
        aria-hidden
      />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-accent/30 bg-accent/10 text-sm"
              aria-hidden
            >
              ✦
            </span>
            <p className={`font-display font-bold text-ink ${compact ? "text-base" : "text-lg"}`}>
              {title}
            </p>
          </div>
          <p className={`mt-2 text-muted ${compact ? "text-xs" : "text-sm"} leading-relaxed`}>
            {description}
          </p>
          {highlights.length > 0 && (
            <ul className={`mt-3 space-y-1.5 ${compact ? "text-xs" : "text-sm"} text-ink/80`}>
              {highlights.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="shrink-0 text-accent" aria-hidden>
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          <PilotCheckoutButton
            plan="pilot"
            signedIn
            variant="accent"
            className="w-full sm:w-auto"
            feature={feature}
          >
            <span className="px-1">{cta}</span>
          </PilotCheckoutButton>
          <button
            type="button"
            onClick={goToPricing}
            className="text-center text-xs font-semibold text-accent transition hover:text-accent-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            Compare plans
          </button>
          <Link
            href="/dashboard/settings"
            className="text-center text-[11px] text-muted transition hover:text-ink"
            onClick={() =>
              trackEvent("upgrade_prompt_clicked", {
                feature,
                destination: "settings",
              })
            }
          >
            View plan in settings
          </Link>
        </div>
      </div>
    </div>
  );
}
