import Stripe from "stripe";
import type { BillingPlan } from "@/lib/billing/types";
import {
  stripeFleetPriceId,
  stripePilotPriceId,
  stripeSecretKey,
} from "@/lib/stripe/config";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  const key = stripeSecretKey();
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

/** Stripe API 2025+ stores billing period on items, not the subscription root. */
export function subscriptionCurrentPeriodEnd(
  subscription: Stripe.Subscription,
): number | null {
  const fromItems = subscription.items.data
    .map((item) => item.current_period_end)
    .filter((value): value is number => typeof value === "number" && value > 0);

  if (fromItems.length > 0) {
    return Math.min(...fromItems);
  }

  const legacy = (
    subscription as Stripe.Subscription & { current_period_end?: number }
  ).current_period_end;

  return typeof legacy === "number" && legacy > 0 ? legacy : null;
}

export function mapSubscriptionToBilling(subscription: Stripe.Subscription): {
  plan: BillingPlan;
  status: "inactive" | "active" | "trialing" | "past_due" | "canceled";
  currentPeriodEnd: string | null;
} {
  const status = subscription.status;
  let billingStatus: "inactive" | "active" | "trialing" | "past_due" | "canceled" =
    "inactive";

  if (status === "active") billingStatus = "active";
  else if (status === "trialing") billingStatus = "trialing";
  else if (status === "past_due") billingStatus = "past_due";
  else if (status === "canceled" || status === "unpaid") billingStatus = "canceled";

  const priceId = subscription.items.data[0]?.price?.id ?? null;
  const fleetPrice = stripeFleetPriceId();
  const pilotPrice = stripePilotPriceId();

  let plan: BillingPlan = "free";
  if (
    status === "active" ||
    status === "trialing" ||
    status === "past_due"
  ) {
    if (fleetPrice && priceId === fleetPrice) plan = "fleet";
    else if (pilotPrice && priceId === pilotPrice) plan = "pilot";
    else plan = "pilot";
  }

  return {
    plan,
    status: billingStatus,
    currentPeriodEnd: (() => {
      const periodEnd = subscriptionCurrentPeriodEnd(subscription);
      return periodEnd ? new Date(periodEnd * 1000).toISOString() : null;
    })(),
  };
}
