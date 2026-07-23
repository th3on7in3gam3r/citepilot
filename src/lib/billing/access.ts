import { getBillingByUserId } from "@/lib/billing/store";
import { isFleetPlan, isPaidPlan } from "@/lib/billing/types";
import { userHasFleetOverride } from "@/lib/billing/fleet-override";
import { isNeonAuthEnabled } from "@/lib/auth/server";
import { isLocalDevelopment, isProductionRuntime } from "@/lib/env/runtime";
import { isStripeConfigured } from "@/lib/stripe/config";

/**
 * Local dev convenience only — never bypass paid gates on Vercel production.
 * Preview/staging can set ALLOW_BILLING_BYPASS=1 for demos.
 */
function allowUnauthenticatedBillingBypass(): boolean {
  if (isProductionRuntime()) return false;
  if (isLocalDevelopment()) {
    return !isStripeConfigured() || !isNeonAuthEnabled();
  }
  if (process.env.ALLOW_BILLING_BYPASS === "1") {
    console.warn("[billing] ALLOW_BILLING_BYPASS=1 — paid features unlocked");
    return true;
  }
  return false;
}

function logProductionBillingMisconfig(): void {
  if (!isProductionRuntime()) return;
  if (!isStripeConfigured()) {
    console.error(
      "[billing] STRIPE_SECRET_KEY / STRIPE_PILOT_PRICE_ID missing in production",
    );
  }
  if (!isNeonAuthEnabled()) {
    console.error(
      "[billing] Neon Auth is not configured in production — denying paid access",
    );
  }
}

export async function userHasPilotAccess(userId: string | null): Promise<boolean> {
  if (allowUnauthenticatedBillingBypass()) return true;

  if (isProductionRuntime() && (!isStripeConfigured() || !isNeonAuthEnabled())) {
    logProductionBillingMisconfig();
    return false;
  }

  if (!userId) return false;
  if (await userHasFleetOverride(userId)) return true;
  const billing = await getBillingByUserId(userId);
  return isPaidPlan(billing);
}

export async function userHasFleetAccess(userId: string | null): Promise<boolean> {
  if (allowUnauthenticatedBillingBypass()) return true;

  if (isProductionRuntime() && (!isStripeConfigured() || !isNeonAuthEnabled())) {
    logProductionBillingMisconfig();
    return false;
  }

  if (!userId) return false;
  if (await userHasFleetOverride(userId)) return true;
  const billing = await getBillingByUserId(userId);
  return isFleetPlan(billing);
}

export const PILOT_UPGRADE_MESSAGE =
  "Pilot or Fleet subscription required — upgrade on the Pricing page or in Settings → Plan.";

export const FLEET_UPGRADE_MESSAGE =
  "Fleet plan required for this feature — upgrade on the Pricing page or in Settings → Plan.";
