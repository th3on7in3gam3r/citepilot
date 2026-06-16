import { NextResponse } from "next/server";
import { logAdminAction } from "@/lib/admin/audit-log";
import { requireAdminApi } from "@/lib/admin/auth";
import { getBillingByUserId } from "@/lib/billing/store";
import { getStripe } from "@/lib/stripe/server";
import { stripeSecretKey } from "@/lib/stripe/config";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ userId: string }> };

export const POST = withApiLogging(async function POST(request: Request, ctx: Ctx) {
  const admin = await requireAdminApi(request);
  if (admin instanceof Response) return admin;

  if (!stripeSecretKey()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const { userId } = await ctx.params;
  const body = (await request.json()) as { months?: number };
  const months = Math.min(Math.max(body.months ?? 1, 1), 12);

  const billing = await getBillingByUserId(userId);
  if (!billing?.stripeCustomerId) {
    return NextResponse.json({ error: "No Stripe customer" }, { status: 400 });
  }

  const stripe = getStripe();
  const amountCents = billing.plan === "fleet" ? 24900 * months : 7900 * months;
  await stripe.customers.createBalanceTransaction(billing.stripeCustomerId, {
    amount: -amountCents,
    currency: "usd",
    description: `Admin credit: ${months} month(s)`,
  });

  await logAdminAction({
    adminId: admin.id,
    adminEmail: admin.email,
    action: "apply_credit",
    targetUserId: userId,
    metadata: { months, amountCents },
  });

  return NextResponse.json({ ok: true });
});
