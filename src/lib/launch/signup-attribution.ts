import { dbGet, dbRun } from "@/lib/db";
import type { PhAttribution } from "@/lib/launch/utm";

export async function persistSignupAttribution(
  userId: string,
  attribution: PhAttribution | null,
): Promise<void> {
  if (!attribution?.source && !attribution?.campaign && !attribution?.medium) {
    return;
  }

  const now = new Date().toISOString();
  const existing = await dbGet<{ user_id: string }>(
    `SELECT user_id FROM user_onboarding WHERE user_id = ?`,
    [userId],
  );

  if (existing) {
    await dbRun(
      `UPDATE user_onboarding
       SET signup_source = COALESCE(?, signup_source),
           signup_campaign = COALESCE(?, signup_campaign),
           signup_medium = COALESCE(?, signup_medium)
       WHERE user_id = ?`,
      [
        attribution.source ?? null,
        attribution.campaign ?? null,
        attribution.medium ?? null,
        userId,
      ],
    );
    return;
  }

  await dbRun(
    `INSERT INTO user_onboarding (
      user_id, dismissed_at, shared_proof, created_at,
      signup_source, signup_campaign, signup_medium
    ) VALUES (?, NULL, 0, ?, ?, ?, ?)`,
    [
      userId,
      now,
      attribution.source ?? null,
      attribution.campaign ?? null,
      attribution.medium ?? null,
    ],
  );
}
