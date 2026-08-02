import { NextResponse } from "next/server";
import { grantBillingPlan } from "@/lib/billing/store";
import type { BillingPlan } from "@/lib/billing/types";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

export const POST = withApiLogging(async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      userId?: string;
      plan?: BillingPlan;
    };

    const userId = body.userId?.trim();
    const plan = body.plan;

    if (!userId || !plan || !["pilot", "fleet", "free"].includes(plan)) {
      return NextResponse.json(
        { error: "userId and plan (pilot|fleet|free) required" },
        { status: 400 },
      );
    }

    if (plan === "free") {
      const account = await grantBillingPlan({
        userId,
        plan: "free",
        status: "inactive",
        currentPeriodEnd: null,
      });
      return NextResponse.json({ account });
    }

    const account = await grantBillingPlan({
      userId,
      plan,
      status: "active",
    });

    return NextResponse.json({ account });
  } catch (error) {
    console.error("POST /api/admin/billing/grant", error);
    return NextResponse.json({ error: "Grant failed" }, { status: 500 });
  }
});
