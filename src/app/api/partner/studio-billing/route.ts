import { NextResponse } from "next/server";
import { grantBillingPlan } from "@/lib/billing/store";
import type { BillingPlan } from "@/lib/billing/types";
import { emitStudioOpsEvent } from "@/lib/studio-ops";
import {
  resolveCitePilotUserId,
  verifyStudioBillingSignature,
  type StudioBillingPartnerEvent,
} from "@/lib/studio-billing/partner";

export const runtime = "nodejs";

function citePilotPlanFromEvent(event: StudioBillingPartnerEvent): BillingPlan | null {
  const ent = event.entitlements.citepilot as { plan?: string } | undefined;
  if (!ent?.plan) return null;
  if (ent.plan === "fleet") return "fleet";
  if (ent.plan === "pilot") return "pilot";
  return null;
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-studio-billing-signature");

  if (!verifyStudioBillingSignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: StudioBillingPartnerEvent;
  try {
    event = JSON.parse(body) as StudioBillingPartnerEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!event.products.includes("citepilot")) {
    return NextResponse.json({ ok: true, skipped: "not a CitePilot bundle" });
  }

  const userId = await resolveCitePilotUserId(event);
  if (!userId) {
    return NextResponse.json(
      { error: "No CitePilot user for email — sign up first with same email" },
      { status: 404 },
    );
  }

  if (event.type === "bundle.canceled") {
    await grantBillingPlan({ userId, plan: "free", status: "canceled" });
    emitStudioOpsEvent("bundle.canceled", {
      userId,
      bundleId: event.bundleId,
      email: event.email,
      stripeCustomerId: event.stripeCustomerId,
      stripeSubscriptionId: event.stripeSubscriptionId,
      products: event.products,
    });
    return NextResponse.json({ ok: true, userId, plan: "free" });
  }

  const plan = citePilotPlanFromEvent(event);
  if (!plan) {
    return NextResponse.json({ error: "No citepilot entitlement in bundle" }, { status: 400 });
  }

  await grantBillingPlan({
    userId,
    plan,
    status: "active",
    currentPeriodEnd: new Date(Date.now() + 32 * 86400000).toISOString(),
  });

  const bundleType =
    event.type === "bundle.updated" ? "bundle.updated" : "bundle.activated";
  emitStudioOpsEvent(bundleType, {
    userId,
    plan,
    bundleId: event.bundleId,
    email: event.email,
    stripeCustomerId: event.stripeCustomerId,
    stripeSubscriptionId: event.stripeSubscriptionId,
    products: event.products,
    entitlements: event.entitlements,
  });

  return NextResponse.json({ ok: true, userId, plan });
}
