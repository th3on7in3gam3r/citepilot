"use client";

import { useState } from "react";
import type { BillingInterval } from "@/lib/billing/types";
import { PricingTierActions } from "@/components/billing/PricingTierActions";
import { pricingTiers } from "@/lib/content";

const ANNUAL_PRICES: Record<string, { price: string; note: string }> = {
  Pilot: { price: "$63", note: "billed annually ($756/yr)" },
  Fleet: { price: "$199", note: "billed annually ($2,388/yr)" },
};

function displayPrice(
  tierName: string,
  monthlyPrice: string,
  interval: BillingInterval,
): { price: string; period: string; note?: string } {
  if (interval === "annual" && ANNUAL_PRICES[tierName]) {
    const annual = ANNUAL_PRICES[tierName]!;
    return {
      price: annual.price,
      period: "/mo",
      note: annual.note,
    };
  }
  return { price: monthlyPrice, period: tierName === "Audit" ? "" : "/mo" };
}

export function PricingPlanCards() {
  const [interval, setInterval] = useState<BillingInterval>("monthly");

  return (
    <>
      <div className="mt-8 flex flex-col items-center gap-3">
        <div
          className="inline-flex rounded-full border border-white/15 bg-white/[0.04] p-1"
          role="group"
          aria-label="Billing interval"
        >
          <button
            type="button"
            onClick={() => setInterval("monthly")}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
              interval === "monthly"
                ? "bg-white text-ink"
                : "text-white/65 hover:text-white"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setInterval("annual")}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
              interval === "annual"
                ? "bg-white text-ink"
                : "text-white/65 hover:text-white"
            }`}
          >
            Annual
            <span className="ml-1.5 text-xs font-bold text-mint">Save 20%</span>
          </button>
        </div>
        {interval === "annual" && (
          <p className="text-center text-xs text-white/45">
            {/* TODO: wire STRIPE_PILOT_ANNUAL_PRICE_ID + STRIPE_FLEET_ANNUAL_PRICE_ID in Stripe */}
            Annual checkout uses Stripe annual price IDs when configured.
          </p>
        )}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-3 lg:gap-6">
        {pricingTiers.map((tier) => {
          const shown = displayPrice(tier.name, tier.price, interval);

          return (
            <article
              key={tier.name}
              className={`flex flex-col rounded-2xl border p-8 md:p-10 ${
                tier.highlighted
                  ? "border-accent/40 bg-gradient-to-b from-accent/20 to-white/[0.06] text-white shadow-xl shadow-accent/10"
                  : "border-white/10 bg-white/[0.04] text-white backdrop-blur-sm"
              }`}
            >
              <h3 className="font-display text-lg font-bold text-white">
                {tier.name}
              </h3>
              <p className="mt-5 font-display text-4xl font-bold">
                {shown.price}
                <span
                  className={`text-base font-normal ${
                    tier.highlighted ? "text-white/60" : "text-white/50"
                  }`}
                >
                  {shown.period}
                </span>
              </p>
              {shown.note && (
                <p className="mt-1 text-xs text-white/45">{shown.note}</p>
              )}
              <p
                className={`mt-3 text-sm leading-relaxed ${
                  tier.highlighted ? "text-white/65" : "text-white/55"
                }`}
              >
                {tier.description}
              </p>
              <ul className="mt-8 flex-1 space-y-4">
                {tier.features.map((f) => (
                  <li
                    key={f}
                    className={`flex gap-3 text-sm leading-relaxed ${
                      tier.highlighted ? "text-white/80" : "text-white/70"
                    }`}
                  >
                    <span className="shrink-0 text-glow">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-10 w-full">
                <PricingTierActions
                  tierName={tier.name}
                  href={tier.href}
                  cta={tier.cta}
                  billingInterval={interval}
                  variant={
                    tier.highlighted
                      ? "dark"
                      : tier.name === "Audit"
                        ? "accent"
                        : "primary"
                  }
                />
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
