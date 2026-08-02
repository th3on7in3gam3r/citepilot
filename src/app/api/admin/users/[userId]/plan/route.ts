import { NextResponse } from "next/server";
import { logAdminAction } from "@/lib/admin/audit-log";
import { requireAdminApi } from "@/lib/admin/auth";
import { grantBillingPlan } from "@/lib/billing/store";
import type { BillingPlan } from "@/lib/billing/types";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ userId: string }> };

export const PATCH = withApiLogging(async function PATCH(request: Request, ctx: Ctx) {
  const admin = await requireAdminApi(request);
  if (admin instanceof Response) return admin;

  const { userId } = await ctx.params;
  const body = (await request.json()) as { plan?: BillingPlan };
  const plan = body.plan;
  if (!plan || !["free", "pilot", "fleet"].includes(plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  if (plan === "free") {
    await grantBillingPlan({ userId, plan: "free", status: "inactive" });
  } else {
    await grantBillingPlan({ userId, plan, status: "active" });
  }

  await logAdminAction({
    adminId: admin.id,
    adminEmail: admin.email,
    action: "change_plan",
    targetUserId: userId,
    metadata: { plan },
  });

  return NextResponse.json({ ok: true });
});
