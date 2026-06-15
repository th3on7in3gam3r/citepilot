import { dbAll, dbGet, dbRun } from "@/lib/db";
import { parsePreferences } from "@/lib/settings";

/** Best-effort email for a user (Neon Auth has no local users table). */
export async function resolveUserEmail(userId: string): Promise<string | null> {
  const referral = await dbGet<{ email: string | null }>(
    `SELECT email FROM user_referrals WHERE user_id = ?`,
    [userId],
  );
  if (referral?.email?.trim()) return referral.email.trim();

  const workspaces = await dbAll<{ preferences: string }>(
    `SELECT preferences FROM workspaces WHERE user_id = ? ORDER BY updated_at DESC LIMIT 3`,
    [userId],
  );
  for (const ws of workspaces) {
    const prefs = parsePreferences(ws.preferences);
    const monitoring = prefs.monitoringEmail?.trim();
    if (monitoring) return monitoring;
  }

  return null;
}

export async function cacheUserEmail(
  userId: string,
  email: string,
): Promise<void> {
  const trimmed = email.trim();
  if (!trimmed) return;
  const existing = await dbGet<{ user_id: string }>(
    `SELECT user_id FROM user_referrals WHERE user_id = ?`,
    [userId],
  );
  if (existing) {
    await dbRun(`UPDATE user_referrals SET email = ? WHERE user_id = ?`, [
      trimmed,
      userId,
    ]);
  }
}
