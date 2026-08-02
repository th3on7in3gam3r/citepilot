import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getBillingByUserId, upsertBillingAccount } from "@/lib/billing/store";
import { isPaidPlan, isActiveBillingStatus, type BillingPlan } from "@/lib/billing/types";
import { processReferralConversion } from "@/lib/referrals/process";
import { emitStudioOpsEvent } from "@/lib/studio-ops";
import {
  triggerChurnPrevention,
  triggerPilotRetention,
} from "@/lib/email/sequences/engine";
import { stripeWebhookSecret } from "@/lib/stripe/config";
import { captureServerException } from "@/lib/observability/sentry";
import { getStripe, mapSubscriptionToBilling } from "@/lib/stripe/server";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

async function syncSubscription(
  subscription: Stripe.Subscription,
  userId: string,
): Promise<void> {
  const mapped = mapSubscriptionToBilling(subscription);
  const previous = await getBillingByUserId(userId);
  const wasPaid = isPaidPlan(previous);
  const previousPlan: BillingPlan = previous?.plan ?? "free";

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

  const updated = await getBillingByUserId(userId);
  const nowPaid = isPaidPlan(updated);
  const stripeCustomerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  if (!wasPaid && nowPaid && updated) {
    emitStudioOpsEvent("subscription.upgraded", {
      userId,
      plan: updated.plan,
      previousPlan,
      stripeCustomerId,
      stripeSubscriptionId: subscription.id,
      status: updated.status,
    });
  } else if (
    wasPaid &&
    nowPaid &&
    updated &&
    previousPlan !== updated.plan &&
    updated.plan !== "free"
  ) {
    emitStudioOpsEvent("subscription.upgraded", {
      userId,
      plan: updated.plan,
      previousPlan,
      stripeCustomerId,
      stripeSubscriptionId: subscription.id,
      status: updated.status,
    });
  } else if (wasPaid && !nowPaid) {
    emitStudioOpsEvent("subscription.canceled", {
      userId,
      plan: previousPlan,
      stripeCustomerId,
      stripeSubscriptionId: subscription.id,
      status: updated?.status ?? mapped.status,
    });
  }

  if (!wasPaid && isPaidPlan(updated)) {
    await processReferralConversion(userId);
    void triggerPilotRetention(userId).catch((err) =>
      console.error("Pilot retention sequence failed", err),
    );
  }

  const wasActive = previous && isActiveBillingStatus(previous.status);
  const isPastDue = updated?.status === "past_due";
  if (wasActive && isPastDue) {
    void triggerChurnPrevention(userId).catch((err) =>
      console.error("Churn sequence failed", err),
    );
  }
}

export const POST = withApiLogging(async function POST(request: Request) {
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
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id;
        if (!customerId) break;
        const row = await import("@/lib/db").then((m) =>
          m.dbGet<{ user_id: string }>(
            `SELECT user_id FROM billing_accounts WHERE stripe_customer_id = ?`,
            [customerId],
          ),
        );
        if (row?.user_id) {
          void triggerChurnPrevention(row.user_id).catch((err) =>
            console.error("Churn sequence failed", err),
          );
        }
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
});
