import { dbGet, dbRun } from "@/lib/db";
import type { BillingAccount, BillingPlan, BillingStatus } from "./types";

type BillingRow = {
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: string;
  status: string;
  current_period_end: string | null;
  updated_at: string;
};

function rowToAccount(row: BillingRow): BillingAccount {
  return {
    userId: row.user_id,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    plan: row.plan as BillingPlan,
    status: row.status as BillingStatus,
    currentPeriodEnd: row.current_period_end,
    updatedAt: row.updated_at,
  };
}

export async function getBillingByUserId(
  userId: string,
): Promise<BillingAccount | null> {
  const row = await dbGet<BillingRow>(
    `SELECT * FROM billing_accounts WHERE user_id = ?`,
    [userId],
  );
  return row ? rowToAccount(row) : null;
}

export async function upsertBillingAccount(input: {
  userId: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  plan?: BillingPlan;
  status?: BillingStatus;
  currentPeriodEnd?: string | null;
}): Promise<BillingAccount> {
  const existing = await getBillingByUserId(input.userId);
  const now = new Date().toISOString();

  if (!existing) {
    await dbRun(
      `INSERT INTO billing_accounts (
        user_id, stripe_customer_id, stripe_subscription_id,
        plan, status, current_period_end, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        input.userId,
        input.stripeCustomerId ?? null,
        input.stripeSubscriptionId ?? null,
        input.plan ?? "free",
        input.status ?? "inactive",
        input.currentPeriodEnd ?? null,
        now,
      ],
    );
  } else {
    await dbRun(
      `UPDATE billing_accounts SET
        stripe_customer_id = ?,
        stripe_subscription_id = ?,
        plan = ?,
        status = ?,
        current_period_end = ?,
        updated_at = ?
       WHERE user_id = ?`,
      [
        input.stripeCustomerId ?? existing.stripeCustomerId,
        input.stripeSubscriptionId ?? existing.stripeSubscriptionId,
        input.plan ?? existing.plan,
        input.status ?? existing.status,
        input.currentPeriodEnd ?? existing.currentPeriodEnd,
        now,
        input.userId,
      ],
    );
  }

  const account = await getBillingByUserId(input.userId);
  return account!;
}
