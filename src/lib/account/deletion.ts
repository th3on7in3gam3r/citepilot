import { randomBytes } from "crypto";
import { auth } from "@/lib/auth/server";
import { logComplianceEvent } from "@/lib/account/compliance-log";
import { getBillingByUserId, upsertBillingAccount } from "@/lib/billing/store";
import type { BillingPlan, BillingStatus } from "@/lib/billing/types";
import { dbGet, dbRun } from "@/lib/db";
import { sendEmail } from "@/lib/email/send";
import { recordUnsubscribe } from "@/lib/email/sequences/store";
import { unsubscribeResendContact } from "@/lib/account/resend-contacts";
import { deletePostHogPerson } from "@/lib/account/posthog-delete";
import { isTotpEnabledForUser, verifyTotpOrBackup } from "@/lib/security/totp-store";
import { getStripe } from "@/lib/stripe/server";
import { site } from "@/lib/site";

export type UserAccountRow = {
  user_id: string;
  email: string | null;
  deletion_status: string;
  deleted_at: string | null;
  deletion_requested_at: string | null;
  cancellation_token: string | null;
  cancellation_token_expires_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  previous_plan: string | null;
  previous_billing_status: string | null;
  created_at: string;
  updated_at: string;
};

const CANCELLATION_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function nowIso(): string {
  return new Date().toISOString();
}

function generateCancellationToken(): string {
  return randomBytes(24).toString("base64url");
}

export async function getUserAccount(
  userId: string,
): Promise<UserAccountRow | undefined> {
  return dbGet<UserAccountRow>(`SELECT * FROM user_accounts WHERE user_id = ?`, [
    userId,
  ]);
}

export async function isDeletionScheduled(userId: string): Promise<boolean> {
  const row = await getUserAccount(userId);
  return row?.deletion_status === "scheduled";
}

export async function verifyDeleteIdentity(input: {
  userId: string;
  email: string;
  password?: string;
  totpToken?: string;
}): Promise<{ ok: true } | { error: string }> {
  const totpEnabled = await isTotpEnabledForUser(input.userId);

  if (totpEnabled) {
    const token = input.totpToken?.trim();
    if (!token) {
      return { error: "Enter your authenticator or backup code" };
    }
    const result = await verifyTotpOrBackup(input.userId, token);
    if ("error" in result) return { error: result.error };
    return { ok: true };
  }

  const password = input.password?.trim();
  if (!password) {
    return { error: "Enter your current password to confirm" };
  }
  if (!auth) {
    return { error: "Authentication is not configured" };
  }

  const { error } = await auth.signIn.email({
    email: input.email,
    password,
    rememberMe: false,
  });
  if (error) {
    return { error: "Incorrect password" };
  }
  return { ok: true };
}

async function cancelStripeSubscription(
  subscriptionId: string | null | undefined,
): Promise<void> {
  if (!subscriptionId) return;
  try {
    const stripe = getStripe();
    await stripe.subscriptions.cancel(subscriptionId);
  } catch (error) {
    console.error("[account/delete] Stripe cancel failed", error);
  }
}

async function revokeNeonAuthSessions(): Promise<void> {
  if (!auth) return;
  try {
    if ("revokeSessions" in auth && typeof auth.revokeSessions === "function") {
      await auth.revokeSessions();
    }
  } catch (error) {
    console.error("[account/delete] revokeSessions failed", error);
  }
}

async function deleteNeonAuthUser(): Promise<void> {
  if (!auth) return;
  try {
    if ("deleteUser" in auth && typeof auth.deleteUser === "function") {
      await auth.deleteUser();
    }
  } catch (error) {
    console.error("[account/delete] deleteUser failed", error);
  }
}

export async function requestAccountDeletion(input: {
  userId: string;
  email: string;
}): Promise<
  | { ok: true; cancellationToken: string; cancellationExpiresAt: string }
  | { error: string }
> {
  const existing = await getUserAccount(input.userId);
  if (existing?.deletion_status === "scheduled") {
    return { error: "Account deletion is already scheduled" };
  }

  const billing = await getBillingByUserId(input.userId);
  const now = nowIso();
  const cancellationToken = generateCancellationToken();
  const cancellationExpiresAt = new Date(
    Date.now() + CANCELLATION_WINDOW_MS,
  ).toISOString();

  await cancelStripeSubscription(billing?.stripeSubscriptionId);

  if (billing) {
    await upsertBillingAccount({
      userId: input.userId,
      plan: "free",
      status: "canceled",
      stripeSubscriptionId: null,
    });
  }

  await dbRun(`DELETE FROM fleet_api_keys WHERE user_id = ?`, [input.userId]);
  await dbRun(`DELETE FROM slack_connections WHERE user_id = ?`, [input.userId]);
  await dbRun(`DELETE FROM webhook_endpoints WHERE user_id = ?`, [input.userId]);
  await dbRun(
    `DELETE FROM workspace_members WHERE user_id = ?`,
    [input.userId],
  );
  await recordUnsubscribe(input.userId, input.email);
  await unsubscribeResendContact(input.email);

  if (existing) {
    await dbRun(
      `UPDATE user_accounts SET
         email = ?, deletion_status = 'scheduled', deleted_at = ?,
         deletion_requested_at = ?, cancellation_token = ?,
         cancellation_token_expires_at = ?,
         stripe_customer_id = ?, stripe_subscription_id = ?,
         previous_plan = ?, previous_billing_status = ?, updated_at = ?
       WHERE user_id = ?`,
      [
        input.email,
        now,
        now,
        cancellationToken,
        cancellationExpiresAt,
        billing?.stripeCustomerId ?? null,
        billing?.stripeSubscriptionId ?? null,
        billing?.plan ?? "free",
        billing?.status ?? "inactive",
        now,
        input.userId,
      ],
    );
  } else {
    await dbRun(
      `INSERT INTO user_accounts (
         user_id, email, deletion_status, deleted_at, deletion_requested_at,
         cancellation_token, cancellation_token_expires_at,
         stripe_customer_id, stripe_subscription_id, previous_plan,
         previous_billing_status, created_at, updated_at
       ) VALUES (?, ?, 'scheduled', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.userId,
        input.email,
        now,
        now,
        cancellationToken,
        cancellationExpiresAt,
        billing?.stripeCustomerId ?? null,
        billing?.stripeSubscriptionId ?? null,
        billing?.plan ?? "free",
        billing?.status ?? "inactive",
        now,
        now,
      ],
    );
  }

  await logComplianceEvent({
    userId: input.userId,
    action: "gdpr_deletion_requested",
    metadata: {
      email: input.email,
      stripeCustomerId: billing?.stripeCustomerId ?? null,
    },
  });

  await sendDeletionScheduledEmail({
    email: input.email,
    cancellationToken,
    cancellationExpiresAt,
  });

  await revokeNeonAuthSessions();
  void deletePostHogPerson(input.userId);
  void deleteNeonAuthUser();

  return { ok: true, cancellationToken, cancellationExpiresAt };
}

async function sendDeletionScheduledEmail(input: {
  email: string;
  cancellationToken: string;
  cancellationExpiresAt: string;
}): Promise<void> {
  const cancelUrl = `${site.wwwUrl}/account/cancel-deletion?token=${encodeURIComponent(input.cancellationToken)}`;
  const html = `
    <p>We've received your request to delete your CitePilot account.</p>
    <p>Your account and all associated data will be permanently deleted within 30 days.</p>
    <p>Your subscription has been cancelled immediately.</p>
    <p>If this was a mistake, you can <a href="${cancelUrl}">cancel the deletion</a> within 7 days, or contact <a href="mailto:${site.supportEmail}">${site.supportEmail}</a>.</p>
    <p style="color:#64748b;font-size:14px">Cancellation link expires ${new Date(input.cancellationExpiresAt).toLocaleDateString()}.</p>
  `;
  await sendEmail({
    to: input.email,
    subject: "Your CitePilot account deletion is scheduled",
    html,
    text:
      `We've received your request. Your account and data will be permanently deleted within 30 days. ` +
      `Your subscription has been cancelled immediately. ` +
      `Cancel within 7 days: ${cancelUrl} or email ${site.supportEmail}.`,
  });
}

export async function cancelAccountDeletion(
  token: string,
): Promise<{ ok: true } | { error: string }> {
  const row = await dbGet<UserAccountRow>(
    `SELECT * FROM user_accounts WHERE cancellation_token = ? AND deletion_status = 'scheduled'`,
    [token],
  );
  if (!row) {
    return { error: "Invalid or expired cancellation link" };
  }
  if (
    !row.cancellation_token_expires_at ||
    Date.parse(row.cancellation_token_expires_at) < Date.now()
  ) {
    return { error: "The cancellation window has passed. Please create a new account." };
  }

  const now = nowIso();
  await dbRun(
    `UPDATE user_accounts SET
       deletion_status = 'active', deleted_at = NULL, deletion_requested_at = NULL,
       cancellation_token = NULL, cancellation_token_expires_at = NULL, updated_at = ?
     WHERE user_id = ?`,
    [now, row.user_id],
  );

  const plan = (row.previous_plan ?? "free") as BillingPlan;
  const status = (row.previous_billing_status ?? "inactive") as BillingStatus;

  if (row.stripe_customer_id && plan !== "free" && auth) {
    try {
      const stripe = getStripe();
      const priceEnv =
        plan === "fleet"
          ? process.env.STRIPE_FLEET_PRICE_ID
          : process.env.STRIPE_PILOT_PRICE_ID;
      if (priceEnv) {
        await stripe.subscriptions.create({
          customer: row.stripe_customer_id,
          items: [{ price: priceEnv }],
        });
      }
    } catch (error) {
      console.error("[account/cancel-deletion] Stripe restore failed", error);
    }
  }

  await upsertBillingAccount({
    userId: row.user_id,
    stripeCustomerId: row.stripe_customer_id,
    plan,
    status,
  });

  await logComplianceEvent({
    userId: row.user_id,
    action: "gdpr_deletion_cancelled",
  });

  return { ok: true };
}

export async function processScheduledDeletions(): Promise<{
  processed: number;
  errors: number;
}> {
  const { dbAll } = await import("@/lib/db");
  const cutoff = new Date(Date.now() - CANCELLATION_WINDOW_MS).toISOString();
  const batch = await dbAll<{ user_id: string }>(
    `SELECT user_id FROM user_accounts
     WHERE deletion_status = 'scheduled' AND deletion_requested_at <= ?
     LIMIT 25`,
    [cutoff],
  );

  let processed = 0;
  let errors = 0;

  for (const row of batch) {
    try {
      const { purgeUserData } = await import("@/lib/account/purge");
      await purgeUserData(row.user_id);
      await dbRun(
        `UPDATE user_accounts SET deletion_status = 'completed', updated_at = ? WHERE user_id = ?`,
        [nowIso(), row.user_id],
      );
      processed += 1;
    } catch (error) {
      console.error("[cron/account-deletion] purge failed", row.user_id, error);
      errors += 1;
    }
  }

  return { processed, errors };
}
