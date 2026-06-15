"use client";

import { useState } from "react";
import type { BillingInterval } from "@/lib/billing/types";
import { PricingTierActions } from "@/components/billing/PricingTierActions";
import { pricingTiers } from "@/lib/content";

const ANNUAL_PRICES: Record<string, { price: string; note: string }> = {
  Pilot: { price: "$63", note: "billed annually as $756/yr" },
  Fleet: { price: "$199", note: "billed annually as $2,388/yr" },
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

function AnimatedPrice({
  price,
  period,
  muted,
}: {
  price: string;
  period: string;
  muted: boolean;
}) {
  return (
    <p className="mt-5 font-display text-4xl font-bold">
      <span
        key={`${price}${period}`}
        className="pricing-price-animate inline-flex items-baseline"
      >
        {price}
        <span
          className={`text-base font-normal ${
            muted ? "text-white/60" : "text-white/50"
          }`}
        >
          {period}
        </span>
      </span>
    </p>
  );
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
      </div>

      <div className="mt-10 grid gap-8 pt-2 lg:grid-cols-3 lg:gap-6">
        {pricingTiers.map((tier) => {
          const shown = displayPrice(tier.name, tier.price, interval);
          const isPilot = tier.name === "Pilot";
          const isFree = tier.name === "Audit";

          return (
            <article
              key={tier.name}
              className={`relative flex flex-col rounded-2xl border p-8 md:p-10 ${
                tier.highlighted
                  ? "border-accent/40 bg-gradient-to-b from-accent/20 to-white/[0.06] text-white shadow-xl shadow-accent/10"
                  : "border-white/10 bg-white/[0.04] text-white backdrop-blur-sm"
              }`}
            >
              {isPilot && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-accent/40 bg-accent px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-white shadow-[0_0_20px_rgba(14,165,233,0.35)]">
                  Most popular
                </span>
              )}

              <h3 className="font-display text-lg font-bold text-white">
                {tier.name}
              </h3>

              <AnimatedPrice
                price={shown.price}
                period={shown.period}
                muted={tier.highlighted}
              />

              {shown.note && (
                <p
                  key={shown.note}
                  className="pricing-price-animate mt-1 text-xs text-white/45"
                >
                  {shown.note}
                </p>
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
                      : isFree
                        ? "accent"
                        : "primary"
                  }
                />
              </div>
              {isFree && (
                <p className="mt-4 text-center text-xs leading-relaxed text-white/45">
                  Free audits are one-time snapshots. Upgrade to Pilot for weekly
                  rescans.
                </p>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}
