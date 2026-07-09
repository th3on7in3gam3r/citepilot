import { dbAll, dbGet, dbRun } from "@/lib/db";
import { generateReferralCode, normalizeReferralCode } from "./code";
import { MAX_REFERRAL_CREDITS } from "./constants";
import { emitStudioOpsEvent } from "@/lib/studio-ops";

export type UserReferralRow = {
  user_id: string;
  referral_code: string;
  referred_by: string | null;
  referral_count: number;
  credits_earned: number;
  credits_applied: number;
  link_clicks: number;
  email: string | null;
  created_at: string;
};

export type ReferralAttributionRow = {
  referred_user_id: string;
  referrer_user_id: string;
  signed_up_at: string;
  converted_at: string | null;
  credit_applied_at: string | null;
};

export type ReferralDashboardStats = {
  referralCode: string;
  referralLink: string;
  linkClicks: number;
  signedUp: number;
  converted: number;
  creditsEarned: number;
  creditsApplied: number;
  creditsRemaining: number;
  atCreditCap: boolean;
};

async function uniqueReferralCode(): Promise<string> {
  for (let attempt = 0; attempt < 12; attempt++) {
    const code = generateReferralCode();
    const existing = await dbGet<{ user_id: string }>(
      `SELECT user_id FROM user_referrals WHERE referral_code = ?`,
      [code],
    );
    if (!existing) return code;
  }
  throw new Error("Could not allocate unique referral code");
}

/** Ensure every user has a referral profile (code generated on first access). */
export async function ensureUserReferral(
  userId: string,
  email?: string | null,
): Promise<UserReferralRow> {
  const existing = await dbGet<UserReferralRow>(
    `SELECT user_id, referral_code, referred_by, referral_count, credits_earned,
            credits_applied, link_clicks, email, created_at
     FROM user_referrals WHERE user_id = ?`,
    [userId],
  );
  if (existing) {
    if (email?.trim() && existing.email !== email.trim()) {
      await dbRun(`UPDATE user_referrals SET email = ? WHERE user_id = ?`, [
        email.trim(),
        userId,
      ]);
      return { ...existing, email: email.trim() };
    }
    return existing;
  }

  const code = await uniqueReferralCode();
  const createdAt = new Date().toISOString();
  await dbRun(
    `INSERT INTO user_referrals (
      user_id, referral_code, referred_by, referral_count,
      credits_earned, credits_applied, link_clicks, email, created_at
    ) VALUES (?, ?, NULL, 0, 0, 0, 0, ?, ?)`,
    [userId, code, email?.trim() || null, createdAt],
  );

  emitStudioOpsEvent("user.signup", {
    userId,
    email: email?.trim() || null,
  });

  return {
    user_id: userId,
    referral_code: code,
    referred_by: null,
    referral_count: 0,
    credits_earned: 0,
    credits_applied: 0,
    link_clicks: 0,
    email: email?.trim() || null,
    created_at: createdAt,
  };
}

export async function getUserReferralByCode(
  code: string,
): Promise<UserReferralRow | null> {
  const normalized = normalizeReferralCode(code);
  if (!normalized) return null;
  const row = await dbGet<UserReferralRow>(
    `SELECT user_id, referral_code, referred_by, referral_count, credits_earned,
            credits_applied, link_clicks, email, created_at
     FROM user_referrals WHERE referral_code = ?`,
    [normalized],
  );
  return row ?? null;
}

export async function incrementReferralLinkClicks(
  referrerUserId: string,
): Promise<void> {
  await dbRun(
    `UPDATE user_referrals SET link_clicks = link_clicks + 1 WHERE user_id = ?`,
    [referrerUserId],
  );
}

export async function linkReferredUser(input: {
  referredUserId: string;
  referrerUserId: string;
}): Promise<boolean> {
  if (input.referredUserId === input.referrerUserId) return false;

  const referred = await ensureUserReferral(input.referredUserId);
  if (referred.referred_by) return false;

  const existingAttr = await dbGet<{ referred_user_id: string }>(
    `SELECT referred_user_id FROM referral_attributions WHERE referred_user_id = ?`,
    [input.referredUserId],
  );
  if (existingAttr) return false;

  const now = new Date().toISOString();
  await dbRun(
    `UPDATE user_referrals SET referred_by = ? WHERE user_id = ? AND referred_by IS NULL`,
    [input.referrerUserId, input.referredUserId],
  );
  await dbRun(
    `INSERT INTO referral_attributions (
      referred_user_id, referrer_user_id, signed_up_at, converted_at, credit_applied_at
    ) VALUES (?, ?, ?, NULL, NULL)`,
    [input.referredUserId, input.referrerUserId, now],
  );
  return true;
}

export async function getReferralAttributionByReferredUser(
  referredUserId: string,
): Promise<ReferralAttributionRow | null> {
  const row = await dbGet<ReferralAttributionRow>(
    `SELECT referred_user_id, referrer_user_id, signed_up_at, converted_at, credit_applied_at
     FROM referral_attributions WHERE referred_user_id = ?`,
    [referredUserId],
  );
  return row ?? null;
}

export async function markReferralConverted(input: {
  referredUserId: string;
  referrerUserId: string;
}): Promise<boolean> {
  const now = new Date().toISOString();
  const result = await dbRun(
    `UPDATE referral_attributions
     SET converted_at = ?
     WHERE referred_user_id = ? AND referrer_user_id = ? AND converted_at IS NULL`,
    [now, input.referredUserId, input.referrerUserId],
  );
  return result.changes > 0;
}

export async function markReferralCreditApplied(referredUserId: string): Promise<void> {
  await dbRun(
    `UPDATE referral_attributions SET credit_applied_at = ? WHERE referred_user_id = ?`,
    [new Date().toISOString(), referredUserId],
  );
}

export async function incrementReferrerCredits(referrerUserId: string): Promise<void> {
  await dbRun(
    `UPDATE user_referrals
     SET credits_earned = CASE WHEN credits_earned >= ? THEN credits_earned ELSE credits_earned + 1 END,
         credits_applied = credits_applied + 1
     WHERE user_id = ?`,
    [MAX_REFERRAL_CREDITS, referrerUserId],
  );
}

export async function countReferralsConverted(referrerUserId: string): Promise<number> {
  const row = await dbGet<{ n: number }>(
    `SELECT COUNT(*) AS n FROM referral_attributions
     WHERE referrer_user_id = ? AND converted_at IS NOT NULL`,
    [referrerUserId],
  );
  return row?.n ?? 0;
}

export async function countReferralsSignedUp(referrerUserId: string): Promise<number> {
  const row = await dbGet<{ n: number }>(
    `SELECT COUNT(*) AS n FROM referral_attributions WHERE referrer_user_id = ?`,
    [referrerUserId],
  );
  return row?.n ?? 0;
}

export async function buildReferralDashboardStats(
  userId: string,
  baseUrl: string,
  email?: string | null,
): Promise<ReferralDashboardStats> {
  const profile = await ensureUserReferral(userId, email);
  const signedUp = await countReferralsSignedUp(userId);
  const converted = await countReferralsConverted(userId);
  const creditsRemaining = Math.max(
    0,
    MAX_REFERRAL_CREDITS - profile.credits_earned,
  );

  return {
    referralCode: profile.referral_code,
    referralLink: `${baseUrl.replace(/\/$/, "")}/?ref=${profile.referral_code}`,
    linkClicks: profile.link_clicks,
    signedUp,
    converted,
    creditsEarned: profile.credits_earned,
    creditsApplied: profile.credits_applied,
    creditsRemaining,
    atCreditCap: profile.credits_earned >= MAX_REFERRAL_CREDITS,
  };
}

export async function getReferrerEmail(referrerUserId: string): Promise<string | null> {
  const row = await dbGet<{ email: string | null }>(
    `SELECT email FROM user_referrals WHERE user_id = ?`,
    [referrerUserId],
  );
  return row?.email?.trim() || null;
}

export async function getReferrerProfile(
  referrerUserId: string,
): Promise<UserReferralRow | null> {
  const row = await dbGet<UserReferralRow>(
    `SELECT user_id, referral_code, referred_by, referral_count, credits_earned,
            credits_applied, link_clicks, email, created_at
     FROM user_referrals WHERE user_id = ?`,
    [referrerUserId],
  );
  return row ?? null;
}

export async function referrerCanEarnCredit(referrerUserId: string): Promise<boolean> {
  const profile = await getReferrerProfile(referrerUserId);
  if (!profile) return false;
  return profile.credits_earned < MAX_REFERRAL_CREDITS;
}
