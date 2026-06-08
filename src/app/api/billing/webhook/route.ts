import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { upsertBillingAccount } from "@/lib/billing/store";
import { stripeWebhookSecret } from "@/lib/stripe/config";
import { captureServerException } from "@/lib/observability/sentry";
import { getStripe, mapSubscriptionToBilling } from "@/lib/stripe/server";

export const runtime = "nodejs";

async function syncSubscription(
  subscription: Stripe.Subscription,
  userId: string,
): Promise<void> {
  const mapped = mapSubscriptionToBilling(subscription);
  await upsertBillingAccount({
    userId,
    stripeCustomerId:
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id,
    stripeSubscriptionId: subscription.id,
    plan: mapped.plan,
    status: mapped.status,
    currentPeriodEnd: mapped.currentPeriodEnd,
  });
}

export async function POST(request: Request) {
  // Intentionally not app-rate-limited: Stripe signs payloads and retries on failure.
  const secret = stripeWebhookSecret();
  if (!secret) {
    return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET not set" }, { status: 503 });
  }

  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (error) {
    captureServerException(error, { route: "POST /api/billing/webhook", phase: "verify" });
    console.error("Stripe webhook signature verification failed", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId =
          session.metadata?.userId ?? session.client_reference_id ?? null;
        if (!userId || !session.subscription) break;

        const subscription = await stripe.subscriptions.retrieve(
          String(session.subscription),
        );
        await syncSubscription(subscription, userId);
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        if (!userId) break;
        await syncSubscription(subscription, userId);
        break;
      }
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    captureServerException(error, {
      route: "POST /api/billing/webhook",
      eventType: event.type,
    });
    console.error("Stripe webhook handler", event.type, error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
