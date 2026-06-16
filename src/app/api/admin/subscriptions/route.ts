import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import { getStripe } from "@/lib/stripe/server";
import { stripeSecretKey } from "@/lib/stripe/config";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

function monthlyCents(unitAmount: number | null | undefined, interval?: string): number {
  if (!unitAmount) return 0;
  if (interval === "year") return Math.round(unitAmount / 12);
  return unitAmount;
}

export const GET = withApiLogging(async function GET(request: Request) {
  const admin = await requireAdminApi(request);
  if (admin instanceof Response) return admin;

  if (!stripeSecretKey()) {
    return NextResponse.json({ configured: false, subscriptions: [], mrrHistory: [] });
  }

  const stripe = getStripe();
  const subscriptions: Array<{
    id: string;
    customerId: string;
    customerEmail: string | null;
    plan: string;
    status: string;
    mrrCents: number;
    currentPeriodEnd: string | null;
  }> = [];

  for await (const sub of stripe.subscriptions.list({
    limit: 100,
    expand: ["data.customer", "data.items.data.price"],
  })) {
    const customer = sub.customer;
    const email =
      typeof customer === "object" && customer && "email" in customer
        ? (customer.email as string | null)
        : null;
    const price = sub.items.data[0]?.price;
    const mrrCents = monthlyCents(price?.unit_amount, price?.recurring?.interval);
    subscriptions.push({
      id: sub.id,
      customerId: typeof customer === "string" ? customer : customer.id,
      customerEmail: email,
      plan: price?.nickname ?? price?.id ?? "unknown",
      status: sub.status,
      mrrCents,
      currentPeriodEnd:
        "current_period_end" in sub && typeof sub.current_period_end === "number"
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null,
    });
  }

  const mrrHistory: Array<{ month: string; mrrCents: number }> = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    mrrHistory.push({
      month: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      mrrCents: subscriptions
        .filter((s) => s.status === "active" || s.status === "trialing")
        .reduce((sum, s) => sum + s.mrrCents, 0),
    });
  }

  return NextResponse.json({ configured: true, subscriptions, mrrHistory });
});
