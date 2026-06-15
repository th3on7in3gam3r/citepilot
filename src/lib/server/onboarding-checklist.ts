import { dbGet, dbRun } from "@/lib/db/query";
import type { ChecklistCompletion } from "@/lib/getting-started";
import { parsePreferences } from "@/lib/settings";

export type UserOnboardingRow = {
  user_id: string;
  dismissed_at: string | null;
  shared_proof: number;
  created_at: string;
};

export async function ensureUserOnboarding(userId: string): Promise<UserOnboardingRow> {
  const existing = await dbGet<UserOnboardingRow>(
    `SELECT user_id, dismissed_at, shared_proof, created_at FROM user_onboarding WHERE user_id = ?`,
    [userId],
  );
  if (existing) return existing;

  const createdAt = new Date().toISOString();
  await dbRun(
    `INSERT INTO user_onboarding (user_id, dismissed_at, shared_proof, created_at) VALUES (?, NULL, 0, ?)`,
    [userId, createdAt],
  );
  return {
    user_id: userId,
    dismissed_at: null,
    shared_proof: 0,
    created_at: createdAt,
  };
}

export async function dismissUserOnboarding(userId: string): Promise<void> {
  await ensureUserOnboarding(userId);
  await dbRun(
    `UPDATE user_onboarding SET dismissed_at = ? WHERE user_id = ?`,
    [new Date().toISOString(), userId],
  );
}

export async function markSharedProof(userId: string): Promise<void> {
  await ensureUserOnboarding(userId);
  await dbRun(`UPDATE user_onboarding SET shared_proof = 1 WHERE user_id = ?`, [
    userId,
  ]);
}

export async function buildChecklistCompletion(
  workspaceId: string,
  userId: string,
): Promise<ChecklistCompletion> {
  const row = await ensureUserOnboarding(userId);

  const ws = await dbGet<{
    preferences: string;
    buyer_question: string | null;
  }>(`SELECT preferences, buyer_question FROM workspaces WHERE id = ?`, [
    workspaceId,
  ]);

  const prefs = parsePreferences(ws?.preferences);
  const promptCount = prefs.monitoredPrompts.length;
  const hasBuyer = Boolean(ws?.buyer_question?.trim());
  const effectivePrompts =
    promptCount > 0 ? promptCount : hasBuyer ? 1 : 0;

  const audit = await dbGet<{ n: number }>(
    `SELECT COUNT(*) as n FROM audit_runs WHERE workspace_id = ?`,
    [workspaceId],
  );

  const cms = await dbGet<{ n: number }>(
    `SELECT COUNT(*) as n FROM cms_connections WHERE workspace_id = ?`,
    [workspaceId],
  );

  const share = await dbGet<{ n: number }>(
    `SELECT COUNT(*) as n FROM audit_shares WHERE workspace_id = ?`,
    [workspaceId],
  );

  const alertsConfigured = Boolean(
    prefs.monitoringEmail?.trim() ||
      prefs.weeklyDigest ||
      prefs.auditCompleteEmail ||
      prefs.scoreDropAlerts ||
      prefs.competitorMoveAlerts,
  );

  return {
    audit: (audit?.n ?? 0) > 0,
    prompts: effectivePrompts >= 5,
    cms: (cms?.n ?? 0) > 0,
    alerts: alertsConfigured,
    share: row.shared_proof === 1 || (share?.n ?? 0) > 0,
  };
}
