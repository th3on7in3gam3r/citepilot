import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { getBillingByUserId } from "@/lib/billing/store";
import { appBaseUrl, isStripeConfigured } from "@/lib/stripe/config";
import { getStripe } from "@/lib/stripe/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  try {
    const user = await requireApiUser(request);
    if (user instanceof NextResponse) return user;
    const userId = apiUserId(user);
    if (!userId) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const billing = await getBillingByUserId(userId);
    if (!billing?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No billing account — subscribe to Pilot first" },
        { status: 400 },
      );
    }

    const stripe = getStripe();
    const portal = await stripe.billingPortal.sessions.create({
      customer: billing.stripeCustomerId,
      return_url: `${appBaseUrl()}/dashboard/settings`,
    });

    return NextResponse.json({ url: portal.url });
  } catch (error) {
    console.error("POST /api/billing/portal", error);
    return NextResponse.json({ error: "Billing portal failed" }, { status: 500 });
  }
}
