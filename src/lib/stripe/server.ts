import Stripe from "stripe";
import { stripeSecretKey } from "@/lib/stripe/config";

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
  plan: "free" | "pilot" | "fleet";
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

  const plan =
    status === "active" || status === "trialing" || status === "past_due"
      ? "pilot"
      : "free";

  return {
    plan,
    status: billingStatus,
    currentPeriodEnd: subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null,
  };
}
