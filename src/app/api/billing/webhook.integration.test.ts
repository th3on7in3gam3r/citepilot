import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";

const upsertBillingAccount = vi.fn().mockResolvedValue(undefined);
const constructEvent = vi.fn();
const retrieve = vi.fn();

vi.mock("@/lib/billing/store", () => ({
  upsertBillingAccount,
}));

vi.mock("@/lib/stripe/config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/stripe/config")>();
  return {
    ...actual,
    stripeWebhookSecret: () => "whsec_test",
  };
});

vi.mock("@/lib/stripe/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/stripe/server")>();
  return {
    ...actual,
    getStripe: () => ({
      webhooks: { constructEvent },
      subscriptions: { retrieve },
    }),
  };
});

describe("POST /api/billing/webhook", () => {
  beforeEach(() => {
    upsertBillingAccount.mockClear();
    constructEvent.mockReset();
    retrieve.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("syncs billing when checkout.session.completed fires", async () => {
    const subscription = {
      status: "active",
      customer: "cus_1",
      id: "sub_1",
      metadata: { userId: "user-42" },
      items: { data: [{ price: { id: "price_pilot" } }] },
      current_period_end: Math.floor(Date.now() / 1000) + 3600,
    } as Stripe.Subscription;

    constructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: {
          metadata: { userId: "user-42" },
          client_reference_id: null,
          subscription: "sub_1",
        },
      },
    });
    retrieve.mockResolvedValue(subscription);

    const { POST } = await import("@/app/api/billing/webhook/route");
    const res = await POST(
      new Request("https://example.com/api/billing/webhook", {
        method: "POST",
        headers: {
          "stripe-signature": "sig_test",
          "Content-Type": "application/json",
        },
        body: "{}",
      }),
    );

    expect(res.status).toBe(200);
    expect(upsertBillingAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-42",
        plan: "pilot",
        status: "active",
      }),
    );
  });

  it("rejects invalid signatures", async () => {
    constructEvent.mockImplementation(() => {
      throw new Error("bad sig");
    });

    const { POST } = await import("@/app/api/billing/webhook/route");
    const res = await POST(
      new Request("https://example.com/api/billing/webhook", {
        method: "POST",
        headers: { "stripe-signature": "bad" },
        body: "{}",
      }),
    );

    expect(res.status).toBe(400);
    expect(upsertBillingAccount).not.toHaveBeenCalled();
  });
});
