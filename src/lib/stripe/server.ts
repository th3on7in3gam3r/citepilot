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
    currentPeriodEnd: subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null,
  };
}
