import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import type { BillingPlan } from "@/lib/billing/types";
import { getBillingByUserId } from "@/lib/billing/store";
import {
  appBaseUrl,
  isStripeConfigured,
  stripeFleetAnnualPriceId,
  stripeFleetPriceId,
  stripePilotAnnualPriceId,
  stripePilotPriceId,
} from "@/lib/stripe/config";
import { getStripe } from "@/lib/stripe/server";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

export const POST = withApiLogging(async function POST(request: Request) {
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

    const body = (await request.json().catch(() => ({}))) as {
      plan?: BillingPlan;
      interval?: "monthly" | "annual";
    };
    const plan = body.plan === "fleet" ? "fleet" : "pilot";
    const interval = body.interval === "annual" ? "annual" : "monthly";

    const priceId =
      interval === "annual"
        ? plan === "fleet"
          ? stripeFleetAnnualPriceId() ?? stripeFleetPriceId()
          : stripePilotAnnualPriceId() ?? stripePilotPriceId()
        : plan === "fleet"
          ? stripeFleetPriceId()
          : stripePilotPriceId();
    if (!priceId) {
      return NextResponse.json(
        {
          error:
            plan === "fleet"
              ? interval === "annual"
                ? "Fleet annual checkout not configured — set STRIPE_FLEET_ANNUAL_PRICE_ID"
                : "Fleet checkout not configured — set STRIPE_FLEET_PRICE_ID"
              : interval === "annual"
                ? "Pilot annual checkout not configured — set STRIPE_PILOT_ANNUAL_PRICE_ID"
                : "Pilot price not configured",
        },
        { status: 503 },
      );
    }

    const sessionUser = await getSessionUser(request);
    if (!sessionUser?.email) {
      return NextResponse.json({ error: "Account email required" }, { status: 400 });
    }

    const stripe = getStripe();
    const base = appBaseUrl();
    const billing = await getBillingByUserId(userId);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: billing?.stripeCustomerId ?? undefined,
      customer_email: billing?.stripeCustomerId ? undefined : sessionUser.email,
      client_reference_id: userId,
      metadata: { userId, plan },
      subscription_data: {
        metadata: { userId, plan },
      },
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${base}/dashboard?upgraded=true&plan=${plan}`,
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
});
