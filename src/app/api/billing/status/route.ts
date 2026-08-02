import { NextResponse } from "next/server";
import { optionalApiUser } from "@/lib/auth/api";
import { getBillingByUserId } from "@/lib/billing/store";
import { userHasFleetOverride } from "@/lib/billing/fleet-override";
import { isFleetPlan, isPaidPlan, isPilotPlan, planDisplayName } from "@/lib/billing/types";
import { isStripeConfigured } from "@/lib/stripe/config";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

export const GET = withApiLogging(async function GET(request: Request) {
  try {
    const { userId, signedIn } = await optionalApiUser(request);

    if (!userId) {
      return NextResponse.json({
        configured: isStripeConfigured(),
        plan: "free",
        status: "inactive",
        isPilot: false,
        isFleet: false,
        isPaid: false,
        planLabel: "Free (Audit)",
        signedIn,
      });
    }

    const billing = await getBillingByUserId(userId);
    const fleetOverride = await userHasFleetOverride(userId);

    if (fleetOverride) {
      return NextResponse.json({
        configured: isStripeConfigured(),
        plan: "fleet",
        status: "active",
        isPilot: false,
        isFleet: true,
        isPaid: true,
        planLabel: planDisplayName("fleet", true),
        currentPeriodEnd: billing?.currentPeriodEnd ?? null,
        hasCustomer: Boolean(billing?.stripeCustomerId),
        signedIn: true,
        override: "fleet_qa",
      });
    }

    const paid = isPaidPlan(billing);

    return NextResponse.json({
      configured: isStripeConfigured(),
      plan: billing?.plan ?? "free",
      status: billing?.status ?? "inactive",
      isPilot: isPilotPlan(billing),
      isFleet: isFleetPlan(billing),
      isPaid: paid,
      planLabel: planDisplayName(billing?.plan ?? "free", paid),
      currentPeriodEnd: billing?.currentPeriodEnd ?? null,
      hasCustomer: Boolean(billing?.stripeCustomerId),
      signedIn: true,
    });
  } catch (error) {
    console.error("GET /api/billing/status", error);
    return NextResponse.json({ error: "Could not load billing status" }, { status: 500 });
  }
});
