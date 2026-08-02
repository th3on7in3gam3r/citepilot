import { dbAll, dbGet, dbRun } from "@/lib/db";

export async function getAdminUserDetail(userId: string) {
  const billing = await dbGet<{
    plan: string;
    status: string;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    current_period_end: string | null;
  }>(`SELECT plan, status, stripe_customer_id, stripe_subscription_id, current_period_end
      FROM billing_accounts WHERE user_id = ?`, [userId]);

  const emailRow = await dbGet<{ email: string | null }>(
    `SELECT email FROM user_referrals WHERE user_id = ?`,
    [userId],
  );

  const workspaces = await dbAll<{
    id: string;
    domain: string;
    created_at: string;
    updated_at: string;
  }>(
    `SELECT id, domain, created_at, updated_at FROM workspaces
     WHERE user_id = ? ORDER BY updated_at DESC`,
    [userId],
  );

  const audits = await dbAll<{
    id: string;
    domain: string;
    score: number;
    mode: string;
    created_at: string;
  }>(
    `SELECT ar.id, ar.domain, ar.score, ar.mode, ar.created_at
     FROM audit_runs ar
     JOIN workspaces w ON w.id = ar.workspace_id
     WHERE w.user_id = ?
     ORDER BY ar.created_at DESC LIMIT 20`,
    [userId],
  );

  return {
    userId,
    email: emailRow?.email ?? null,
    billing: billing ?? null,
    workspaces,
    audits,
  };
}

export async function hardDeleteUser(userId: string): Promise<boolean> {
  const { purgeUserData } = await import("@/lib/account/purge");
  await purgeUserData(userId);
  await dbRun(`DELETE FROM user_accounts WHERE user_id = ?`, [userId]);
  return true;
}
