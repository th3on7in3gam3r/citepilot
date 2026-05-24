import { getBillingByUserId } from "@/lib/billing/store";
import { isFleetPlan, isPaidPlan } from "@/lib/billing/types";
import { isNeonAuthEnabled } from "@/lib/auth/server";
import { isStripeConfigured } from "@/lib/stripe/config";

/** Paid features (Pilot + Fleet) are open when Stripe is not configured (local dev). */
export async function userHasPilotAccess(userId: string | null): Promise<boolean> {
  if (!isStripeConfigured()) return true;
  if (!isNeonAuthEnabled()) return true;
  if (!userId) return false;
  const billing = await getBillingByUserId(userId);
  return isPaidPlan(billing);
}

export async function userHasFleetAccess(userId: string | null): Promise<boolean> {
  if (!isStripeConfigured()) return true;
  if (!isNeonAuthEnabled()) return true;
  if (!userId) return false;
  const billing = await getBillingByUserId(userId);
  return isFleetPlan(billing);
}

export const PILOT_UPGRADE_MESSAGE =
  "Pilot or Fleet subscription required — upgrade on the Pricing page or in Settings → Plan.";

export const FLEET_UPGRADE_MESSAGE =
  "Fleet plan required for this feature — upgrade on the Pricing page or in Settings → Plan.";
