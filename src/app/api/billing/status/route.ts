import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { getBillingByUserId } from "@/lib/billing/store";
import { isFleetPlan, isPaidPlan, isPilotPlan, planDisplayName } from "@/lib/billing/types";
import { isStripeConfigured } from "@/lib/stripe/config";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await requireApiUser(request);
    if (user instanceof NextResponse) return user;
    const userId = apiUserId(user);

    if (!userId) {
      return NextResponse.json({
        configured: isStripeConfigured(),
        plan: "free",
        status: "inactive",
        isPilot: false,
        isFleet: false,
        isPaid: false,
        planLabel: "Free (Audit)",
      });
    }

    const billing = await getBillingByUserId(userId);
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
    });
  } catch (error) {
    console.error("GET /api/billing/status", error);
    return NextResponse.json({ error: "Could not load billing status" }, { status: 500 });
  }
}
