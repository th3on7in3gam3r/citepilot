import { dbGet, dbRun } from "@/lib/db/query";
import type { ChecklistCompletion } from "@/lib/getting-started";
import { parsePreferences } from "@/lib/settings";

export type UserOnboardingRow = {
  user_id: string;
  dismissed_at: string | null;
  shared_proof: number;
  created_at: string;
  onboarding_completed_at: string | null;
};

export async function ensureUserOnboarding(userId: string): Promise<UserOnboardingRow> {
  const existing = await dbGet<UserOnboardingRow>(
    `SELECT user_id, dismissed_at, shared_proof, created_at, onboarding_completed_at FROM user_onboarding WHERE user_id = ?`,
    [userId],
  );
  if (existing) return existing;

  const createdAt = new Date().toISOString();
  await dbRun(
    `INSERT INTO user_onboarding (user_id, dismissed_at, shared_proof, created_at, onboarding_completed_at) VALUES (?, NULL, 0, ?, NULL)`,
    [userId, createdAt],
  );
  return {
    user_id: userId,
    dismissed_at: null,
    shared_proof: 0,
    created_at: createdAt,
    onboarding_completed_at: null,
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

export async function markProductTourCompleted(userId: string): Promise<void> {
  await ensureUserOnboarding(userId);
  await dbRun(
    `UPDATE user_onboarding SET onboarding_completed_at = ? WHERE user_id = ?`,
    [new Date().toISOString(), userId],
  );
}

export async function restartProductTour(userId: string): Promise<void> {
  await ensureUserOnboarding(userId);
  await dbRun(
    `UPDATE user_onboarding SET onboarding_completed_at = NULL WHERE user_id = ?`,
    [userId],
  );
}

export async function userHasAnyAudit(userId: string): Promise<boolean> {
  const row = await dbGet<{ n: number }>(
    `SELECT COUNT(*) as n FROM audit_runs ar
     JOIN workspaces w ON w.id = ar.workspace_id
     WHERE w.user_id = ?`,
    [userId],
  );
  return (row?.n ?? 0) > 0;
}

export function daysSince(iso: string): number {
  const start = new Date(iso).getTime();
  if (Number.isNaN(start)) return Number.POSITIVE_INFINITY;
  return (Date.now() - start) / (1000 * 60 * 60 * 24);
}

export async function buildProductTourStatus(userId: string): Promise<{
  completed: boolean;
  shouldShow: boolean;
  daysSinceSignup: number;
  hasAnyAudit: boolean;
}> {
  const onboarding = await ensureUserOnboarding(userId);
  const hasAnyAudit = await userHasAnyAudit(userId);
  const daysSinceSignup = daysSince(onboarding.created_at);
  const completed = Boolean(onboarding.onboarding_completed_at);
  const shouldShow = !completed && daysSinceSignup < 1 && !hasAnyAudit;

  return {
    completed,
    shouldShow,
    daysSinceSignup,
    hasAnyAudit,
  };
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
