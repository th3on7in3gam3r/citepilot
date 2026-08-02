"use client";

import { useState } from "react";
import type { BillingInterval } from "@/lib/billing/types";
import { trackEvent } from "@/lib/analytics/track";
import type { BillingPlan } from "@/lib/billing/types";
import { readStoredPromoCode } from "@/components/launch/ProductHuntPromoBar";

type Props = {
  plan?: Extract<BillingPlan, "pilot" | "fleet">;
  variant?: "accent" | "primary" | "dark";
  className?: string;
  children: React.ReactNode;
  signedIn?: boolean;
  billingInterval?: BillingInterval;
  /** PostHog feature gate id when checkout started from an upgrade prompt */
  feature?: string;
  /** Analytics source: gate, banner, modal, pricing_page, etc. */
  source?: string;
  /** A/B variant for experiment attribution (e.g. pricing-page-layout). */
  abVariant?: string;
};

export function PilotCheckoutButton({
  plan = "pilot",
  variant = "dark",
  className = "",
  children,
  signedIn = false,
  billingInterval = "monthly",
  feature,
  source,
  abVariant,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promoMessage, setPromoMessage] = useState<string | null>(null);

  async function startCheckout() {
    if (!signedIn) {
      window.location.href = "/auth/sign-in?redirect=/pricing";
      return;
    }

    setLoading(true);
    setError(null);
    trackEvent("checkout_started", { plan, feature, source, variant: abVariant });
    trackEvent(plan === "fleet" ? "fleet_checkout_started" : "pilot_checkout_started", {
      feature,
      source,
      variant: abVariant,
    });
    if (source) {
      trackEvent("upgrade_cta_clicked", {
        source,
        feature_name: feature,
        plan,
      });
    }
    try {
      const promoCode = plan === "pilot" && billingInterval === "monthly"
        ? readStoredPromoCode()
        : null;
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          plan,
          interval: billingInterval,
          promoCode: promoCode ?? undefined,
        }),
      });
      const data = (await res.json()) as {
        url?: string;
        error?: string;
        promoApplied?: string;
      };
      if (!res.ok || !data.url) {
        setError(data.error ?? "Checkout failed");
        return;
      }
      if (data.promoApplied) setPromoMessage(data.promoApplied);
      window.location.href = data.url;
    } catch {
      setError("Network error — try again");
    } finally {
      setLoading(false);
    }
  }

  const styles =
    variant === "dark"
      ? "bg-white text-ink hover:bg-white/90"
      : variant === "accent"
        ? "bg-accent text-white hover:bg-accent-deep"
        : "bg-ink text-white hover:bg-ink/90";

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => void startCheckout()}
        disabled={loading}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold transition disabled:opacity-60 ${styles}`}
      >
        {loading ? "Redirecting…" : children}
        {!loading && <span aria-hidden>→</span>}
      </button>
      {error && <p className="mt-2 text-center text-xs text-red-600">{error}</p>}
      {promoMessage && !error && (
        <p className="mt-2 text-center text-xs text-emerald-700">{promoMessage}</p>
      )}
    </div>
  );
}
