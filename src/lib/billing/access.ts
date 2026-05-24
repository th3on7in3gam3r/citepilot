import { getBillingByUserId } from "@/lib/billing/store";
import { isPaidPlan } from "@/lib/billing/types";
import { isNeonAuthEnabled } from "@/lib/auth/server";
import { isStripeConfigured } from "@/lib/stripe/config";

/** Pilot features are open when Stripe is not configured (local dev). */
export async function userHasPilotAccess(userId: string | null): Promise<boolean> {
  if (!isStripeConfigured()) return true;
  if (!isNeonAuthEnabled()) return true;
  if (!userId) return false;
  const billing = await getBillingByUserId(userId);
  return isPaidPlan(billing);
}

export const PILOT_UPGRADE_MESSAGE =
  "Pilot subscription required — upgrade on the Pricing page or in Settings → Plan.";
