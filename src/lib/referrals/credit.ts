import { getBillingByUserId } from "@/lib/billing/store";
import type { BillingPlan } from "@/lib/billing/types";
import { isPaidPlan } from "@/lib/billing/types";
import { captureServerException } from "@/lib/observability/sentry";
import {
  stripeFleetPriceId,
  stripePilotPriceId,
} from "@/lib/stripe/config";
import { getStripe } from "@/lib/stripe/server";

/** One month of the referrer's plan tier (monthly price unit amount). */
export async function monthlyReferralCreditCents(
  plan: BillingPlan,
): Promise<number | null> {
  const priceId =
    plan === "fleet" ? stripeFleetPriceId() : stripePilotPriceId();
  if (!priceId) return null;

  try {
    const stripe = getStripe();
    const price = await stripe.prices.retrieve(priceId);
    if (price.unit_amount && price.unit_amount > 0) {
      return price.unit_amount;
    }
  } catch (err) {
    captureServerException(err, { tags: { area: "referral-credit" } });
  }
  return null;
}

/** Apply one month free as Stripe customer balance credit (negative = credit). */
export async function applyReferralCreditToReferrer(
  referrerUserId: string,
): Promise<{ ok: true; amountCents: number } | { ok: false; reason: string }> {
  const billing = await getBillingByUserId(referrerUserId);
  if (!billing?.stripeCustomerId) {
    return { ok: false, reason: "Referrer has no Stripe customer" };
  }
  if (!isPaidPlan(billing)) {
    return { ok: false, reason: "Referrer is not on a paid plan" };
  }

  const amountCents = await monthlyReferralCreditCents(billing.plan);
  if (!amountCents) {
    return { ok: false, reason: "Could not resolve plan price" };
  }

  try {
    const stripe = getStripe();
    await stripe.customers.createBalanceTransaction(billing.stripeCustomerId, {
      amount: -amountCents,
      currency: "usd",
      description: "Referral reward — 1 month free",
    });
    return { ok: true, amountCents };
  } catch (err) {
    captureServerException(err, {
      tags: { area: "referral-credit" },
      extra: { referrerUserId },
    });
    return { ok: false, reason: "Stripe credit failed" };
  }
}
