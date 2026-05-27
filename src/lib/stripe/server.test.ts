import { describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import { mapSubscriptionToBilling } from "@/lib/stripe/server";

function subscription(
  overrides: Partial<Stripe.Subscription> & {
    status: Stripe.Subscription.Status;
    priceId?: string;
  },
): Stripe.Subscription {
  return {
    status: overrides.status,
    customer: "cus_test",
    id: "sub_test",
    metadata: { userId: "user-1" },
    items: {
      data: [
        {
          price: { id: overrides.priceId ?? "price_pilot" },
        } as Stripe.SubscriptionItem,
      ],
    },
    current_period_end: Math.floor(Date.now() / 1000) + 3600,
  } as Stripe.Subscription;
}

describe("mapSubscriptionToBilling", () => {
  it("maps active pilot subscription", () => {
    vi.stubEnv("STRIPE_FLEET_PRICE_ID", "price_fleet");
    vi.stubEnv("STRIPE_PILOT_PRICE_ID", "price_pilot");
    const mapped = mapSubscriptionToBilling(
      subscription({ status: "active", priceId: "price_pilot" }),
    );
    expect(mapped.plan).toBe("pilot");
    expect(mapped.status).toBe("active");
  });

  it("maps fleet price id", () => {
    vi.stubEnv("STRIPE_FLEET_PRICE_ID", "price_fleet");
    vi.stubEnv("STRIPE_PILOT_PRICE_ID", "price_pilot");
    const mapped = mapSubscriptionToBilling(
      subscription({ status: "active", priceId: "price_fleet" }),
    );
    expect(mapped.plan).toBe("fleet");
  });
});
