"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PilotCheckoutButton } from "@/components/billing/PilotCheckoutButton";
import { useBilling } from "@/contexts/BillingContext";
import {
  useUpgradeModalOptional,
  userTierForAnalytics,
} from "@/contexts/UpgradeModalContext";
import { trackEvent } from "@/lib/analytics/track";
import type { BillingPlan } from "@/lib/billing/types";

export type FeatureGateProps = {
  /** PostHog / analytics identifier, e.g. `weekly_monitoring` */
  feature: string;
  title: string;
  description: string;
  cta?: string;
  highlights?: readonly string[];
  compact?: boolean;
  className?: string;
  plan?: Extract<BillingPlan, "pilot" | "fleet">;
  /** When set, primary text button navigates instead of checkout-only */
  onClick?: () => void;
};

export function FeatureGate({
  feature,
  title,
  description,
  cta,
  highlights = [],
  compact = false,
  className = "",
  plan = "pilot",
  onClick,
}: FeatureGateProps) {
  const router = useRouter();
  const { isPaid, isFleet, ready } = useBilling();
  const upgradeModal = useUpgradeModalOptional();

  const ctaLabel =
    cta ?? (plan === "fleet" ? "Upgrade to Fleet →" : "Upgrade to Pilot →");
  const tier = ready ? userTierForAnalytics(isPaid, isFleet) : "free";

  useEffect(() => {
    trackEvent("feature_gate_viewed", { feature_name: feature, user_tier: tier });
    trackEvent("upgrade_prompt_viewed", { feature });
  }, [feature, tier]);

  function openModal() {
    if (plan === "pilot" && isPaid) return;
    upgradeModal?.openUpgradeModal({
      feature,
      title,
      description,
      plan,
      unlocks: highlights,
    });
  }

  function goToPricing() {
    trackEvent("upgrade_cta_clicked", {
      source: "gate",
      feature_name: feature,
      plan,
      destination: "pricing",
    });
    trackEvent("upgrade_prompt_clicked", { feature, destination: "pricing" });
    if (onClick) {
      onClick();
    } else {
      router.push("/pricing");
    }
  }

  function handleGateClick() {
    openModal();
    if (onClick) onClick();
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
        <button
          type="button"
          onClick={handleGateClick}
          className="min-w-0 flex-1 cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 rounded-lg"
        >
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
        </button>

        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          <PilotCheckoutButton
            plan={plan}
            signedIn
            variant="accent"
            className="w-full sm:w-auto"
            feature={feature}
            source="gate"
          >
            <span className="px-1">{ctaLabel}</span>
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
