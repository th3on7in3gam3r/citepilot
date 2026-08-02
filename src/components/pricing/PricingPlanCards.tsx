"use client";

import { useState } from "react";
import type { BillingInterval } from "@/lib/billing/types";
import { PricingTierActions } from "@/components/billing/PricingTierActions";
import { FEATURE_FLAGS } from "@/lib/analytics/feature-flags";
import { useFeatureFlagVariant } from "@/hooks/useFeatureFlagVariant";
import { useTranslations } from "next-intl";

type TierKey = "audit" | "pilot" | "fleet";

type Tier = {
  key: TierKey;
  price: string;
  annualPrice: string;
  annualNote: string;
  href: string;
  highlighted: boolean;
  featureCount: number;
};

function displayPrice(
  tier: Tier,
  interval: BillingInterval,
  t: ReturnType<typeof useTranslations<"pricing">>,
): { price: string; period: string; note?: string } {
  const name = t(`${tier.key}.name`);
  if (interval === "annual" && tier.key !== "audit") {
    return {
      price: t(`${tier.key}.annualPrice`),
      period: t("periodMo"),
      note: t(`${tier.key}.annualNote`),
    };
  }
  return {
    price: tier.key === "audit" ? t("audit.price") : tier.price,
    period: tier.key === "audit" ? "" : t("periodMo"),
  };
}

function AnimatedPrice({
  price,
  period,
  muted,
  large = false,
}: {
  price: string;
  period: string;
  muted: boolean;
  large?: boolean;
}) {
  return (
    <p
      className={`mt-5 font-display font-bold text-foreground dark:text-white ${
        large ? "text-5xl md:text-6xl" : "text-4xl"
      }`}
    >
      <span
        key={`${price}${period}`}
        className="pricing-price-animate inline-flex items-baseline"
      >
        {price}
        <span
          className={`text-base font-normal ${
            muted
              ? "text-muted dark:text-white/60"
              : "text-muted dark:text-white/50"
          }`}
        >
          {period}
        </span>
      </span>
    </p>
  );
}

function BillingIntervalToggle({
  interval,
  onChange,
}: {
  interval: BillingInterval;
  onChange: (interval: BillingInterval) => void;
}) {
  const t = useTranslations("pricing");

  return (
    <div className="mt-8 flex flex-col items-center gap-3">
      <div
        className="inline-flex rounded-full border border-border bg-surface p-1 dark:border-white/15 dark:bg-white/[0.04]"
        role="group"
        aria-label={t("toggleAriaLabel")}
      >
        <button
          type="button"
          onClick={() => onChange("monthly")}
          className={`rounded-full px-5 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
            interval === "monthly"
              ? "bg-foreground text-background preserve-light-surface dark:bg-white dark:text-on-light"
              : "text-muted hover:text-foreground dark:text-white/65 dark:hover:text-white"
          }`}
        >
          {t("monthly")}
        </button>
        <button
          type="button"
          onClick={() => onChange("annual")}
          className={`rounded-full px-5 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
            interval === "annual"
              ? "bg-foreground text-background preserve-light-surface dark:bg-white dark:text-on-light"
              : "text-muted hover:text-foreground dark:text-white/65 dark:hover:text-white"
          }`}
        >
          {t("annual")}
          <span className="ml-1.5 text-xs font-bold text-mint">{t("save20")}</span>
        </button>
      </div>
    </div>
  );
}

function TierCard({
  tier,
  interval,
  abVariant,
  prominent = false,
}: {
  tier: Tier;
  interval: BillingInterval;
  abVariant: string;
  prominent?: boolean;
}) {
  const t = useTranslations("pricing");
  const shown = displayPrice(tier, interval, t);
  const isPilot = tier.key === "pilot";
  const isFree = tier.key === "audit";
  const features = Array.from({ length: tier.featureCount }, (_, i) =>
    t(`${tier.key}.feature${i}` as "audit.feature0"),
  );

  return (
    <article
      className={`relative flex flex-col rounded-2xl border ${
        prominent || tier.highlighted
          ? "border-accent/40 bg-gradient-to-b from-accent/10 to-card p-8 text-foreground shadow-lg shadow-accent/5 dark:from-accent/20 dark:to-white/[0.06] dark:text-white dark:shadow-xl dark:shadow-accent/10 md:p-12"
          : "border-border bg-card p-8 text-foreground shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:backdrop-blur-sm md:p-10"
      }`}
    >
      {isPilot && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-accent/40 bg-accent px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-white shadow-[0_0_20px_rgba(14,165,233,0.35)]">
          {t("mostPopular")}
        </span>
      )}

      <h3
        className={`font-display font-bold text-foreground dark:text-white ${
          prominent ? "text-2xl" : "text-lg"
        }`}
      >
        {t(`${tier.key}.name`)}
      </h3>

      <AnimatedPrice
        price={shown.price}
        period={shown.period}
        muted={tier.highlighted}
        large={prominent}
      />

      {shown.note && (
        <p
          key={shown.note}
          className="pricing-price-animate mt-1 text-xs text-muted dark:text-white/45"
        >
          {shown.note}
        </p>
      )}

      <p
        className={`mt-3 text-sm leading-relaxed ${
          tier.highlighted
            ? "text-muted dark:text-white/65"
            : "text-muted dark:text-white/55"
        } ${prominent ? "md:text-base" : ""}`}
      >
        {t(`${tier.key}.description`)}
      </p>
      <ul className={`mt-8 flex-1 space-y-4 ${prominent ? "md:grid md:grid-cols-2 md:gap-x-6 md:gap-y-4" : ""}`}>
        {features.map((f) => (
          <li
            key={f}
            className={`flex gap-3 text-sm leading-relaxed ${
              tier.highlighted
                ? "text-foreground/80 dark:text-white/80"
                : "text-muted dark:text-white/70"
            }`}
          >
            <span className="shrink-0 text-accent dark:text-glow">✓</span>
            {f}
          </li>
        ))}
      </ul>
      <div className={`w-full ${prominent ? "mt-10 max-w-md" : "mt-10"}`}>
        <PricingTierActions
          tierName={t(`${tier.key}.name`)}
          href={tier.href}
          cta={t(`${tier.key}.cta`)}
          billingInterval={interval}
          abVariant={abVariant}
          variant={tier.highlighted ? "dark" : isFree ? "accent" : "primary"}
        />
      </div>
      {isFree && (
        <p className="mt-4 text-center text-xs leading-relaxed text-muted dark:text-white/45">
          {t("audit.footnote")}
        </p>
      )}
    </article>
  );
}

const TIERS: Tier[] = [
  {
    key: "audit",
    price: "Free",
    annualPrice: "",
    annualNote: "",
    href: "/audit",
    highlighted: false,
    featureCount: 4,
  },
  {
    key: "pilot",
    price: "$79",
    annualPrice: "$63",
    annualNote: "",
    href: "/start",
    highlighted: true,
    featureCount: 7,
  },
  {
    key: "fleet",
    price: "$249",
    annualPrice: "$199",
    annualNote: "",
    href: "/start?plan=fleet",
    highlighted: false,
    featureCount: 5,
  },
];

export function PricingPlanCards() {
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const layoutVariant = useFeatureFlagVariant(FEATURE_FLAGS.PRICING_PAGE_LAYOUT, {
    fallback: "control",
  });
  const isPilotFocus = layoutVariant === "variant_a";

  const pilotTier = TIERS.find((t) => t.key === "pilot");
  const otherTiers = TIERS.filter((t) => t.key !== "pilot");

  return (
    <>
      <BillingIntervalToggle interval={interval} onChange={setInterval} />

      {isPilotFocus && pilotTier ? (
        <div className="mx-auto mt-10 max-w-3xl space-y-6 pt-2">
          <TierCard
            tier={pilotTier}
            interval={interval}
            abVariant={layoutVariant}
            prominent
          />
          <div className="grid gap-6 sm:grid-cols-2">
            {otherTiers.map((tier) => (
              <TierCard
                key={tier.key}
                tier={tier}
                interval={interval}
                abVariant={layoutVariant}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-10 grid gap-8 pt-2 lg:grid-cols-3 lg:gap-6">
          {TIERS.map((tier) => (
            <TierCard
              key={tier.key}
              tier={tier}
              interval={interval}
              abVariant={layoutVariant}
            />
          ))}
        </div>
      )}
    </>
  );
}
