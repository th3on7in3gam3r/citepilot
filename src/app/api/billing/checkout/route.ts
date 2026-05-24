import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { appBaseUrl, isStripeConfigured, stripePilotPriceId } from "@/lib/stripe/config";
import { getStripe } from "@/lib/stripe/server";
import { getBillingByUserId } from "@/lib/billing/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe not configured — set STRIPE_SECRET_KEY and STRIPE_PILOT_PRICE_ID" },
      { status: 503 },
    );
  }

  try {
    const user = await requireApiUser(request);
    if (user instanceof NextResponse) return user;
    const userId = apiUserId(user);
    if (!userId) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const sessionUser = await getSessionUser(request);
    if (!sessionUser?.email) {
      return NextResponse.json({ error: "Account email required" }, { status: 400 });
    }

    const stripe = getStripe();
    const priceId = stripePilotPriceId()!;
    const base = appBaseUrl();
    const billing = await getBillingByUserId(userId);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: billing?.stripeCustomerId ?? undefined,
      customer_email: billing?.stripeCustomerId ? undefined : sessionUser.email,
      client_reference_id: userId,
      metadata: { userId },
      subscription_data: {
        metadata: { userId },
      },
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${base}/dashboard/settings?billing=success`,
      cancel_url: `${base}/pricing?billing=canceled`,
      allow_promotion_codes: true,
    });

    if (!session.url) {
      return NextResponse.json({ error: "Could not start checkout" }, { status: 502 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("POST /api/billing/checkout", error);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
