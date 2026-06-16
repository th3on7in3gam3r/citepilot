import { NextResponse } from "next/server";
import { logAdminAction } from "@/lib/admin/audit-log";
import { requireAdminApi } from "@/lib/admin/auth";
import { getStripe } from "@/lib/stripe/server";
import { stripeSecretKey } from "@/lib/stripe/config";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export const POST = withApiLogging(async function POST(request: Request, ctx: Ctx) {
  const admin = await requireAdminApi(request);
  if (admin instanceof Response) return admin;

  if (!stripeSecretKey()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const { id } = await ctx.params;
  const body = (await request.json()) as { action?: string; months?: number };
  const stripe = getStripe();

  if (body.action === "cancel") {
    await stripe.subscriptions.cancel(id);
    await logAdminAction({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "subscription_cancel",
      metadata: { subscriptionId: id },
    });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "pause") {
    await stripe.subscriptions.update(id, {
      pause_collection: { behavior: "mark_uncollectible" },
    });
    await logAdminAction({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "subscription_pause",
      metadata: { subscriptionId: id },
    });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "credit") {
    const sub = await stripe.subscriptions.retrieve(id);
    const customerId =
      typeof sub.customer === "string" ? sub.customer : sub.customer.id;
    const months = Math.min(Math.max(body.months ?? 1, 1), 12);
    await stripe.customers.createBalanceTransaction(customerId, {
      amount: -7900 * months,
      currency: "usd",
      description: `Admin subscription credit (${months} mo)`,
    });
    await logAdminAction({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "subscription_credit",
      metadata: { subscriptionId: id, months },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
});
