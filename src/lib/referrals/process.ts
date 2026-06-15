import { trackServerEvent } from "@/lib/analytics/track-server";
import {
  sendReferralConvertedEmail,
  sendReferralSignupEmail,
} from "@/lib/email/referrals";
import { isPaidPlan } from "@/lib/billing/types";
import { getBillingByUserId } from "@/lib/billing/store";
import { applyReferralCreditToReferrer } from "./credit";
import { normalizeReferralCode } from "./code";
import {
  getReferralAttributionByReferredUser,
  getReferrerEmail,
  getUserReferralByCode,
  incrementReferralLinkClicks,
  incrementReferrerCredits,
  linkReferredUser,
  markReferralConverted,
  markReferralCreditApplied,
  referrerCanEarnCredit,
} from "./store";

export async function recordReferralLinkClick(code: string): Promise<{
  ok: boolean;
  referrerUserId?: string;
}> {
  const referrer = await getUserReferralByCode(code);
  if (!referrer) return { ok: false };

  await incrementReferralLinkClicks(referrer.user_id);
  // PostHog: referral_link_clicked is captured client-side in ReferralRefCapture

  return { ok: true, referrerUserId: referrer.user_id };
}

export async function claimReferralForUser(
  userId: string,
  rawCode: string,
): Promise<{ linked: boolean; referrerUserId?: string }> {
  const code = normalizeReferralCode(rawCode);
  if (!code) return { linked: false };

  const referrer = await getUserReferralByCode(code);
  if (!referrer) return { linked: false };
  if (referrer.user_id === userId) return { linked: false };

  const linked = await linkReferredUser({
    referredUserId: userId,
    referrerUserId: referrer.user_id,
  });
  if (!linked) return { linked: false };

  await trackServerEvent("referral_signup_completed", {
    distinctId: userId,
    referrerUserId: referrer.user_id,
    referralCode: code,
  });

  const referrerEmail = await getReferrerEmail(referrer.user_id);
  if (referrerEmail) {
    void sendReferralSignupEmail({ to: referrerEmail });
  }

  return { linked: true, referrerUserId: referrer.user_id };
}

/** Called when a referred user completes first paid checkout. */
export async function processReferralConversion(
  referredUserId: string,
): Promise<void> {
  const billing = await getBillingByUserId(referredUserId);
  if (!billing || !isPaidPlan(billing)) return;

  const attribution = await getReferralAttributionByReferredUser(referredUserId);
  if (!attribution || attribution.converted_at) return;

  const referrerUserId = attribution.referrer_user_id;
  const marked = await markReferralConverted({
    referredUserId,
    referrerUserId,
  });
  if (!marked) return;

  await trackServerEvent("referral_converted_to_paid", {
    distinctId: referredUserId,
    referrerUserId,
  });

  const canEarn = await referrerCanEarnCredit(referrerUserId);
  if (!canEarn) return;

  const credit = await applyReferralCreditToReferrer(referrerUserId);
  if (!credit.ok) {
    console.warn(
      `[referral] credit skipped for ${referrerUserId}: ${credit.reason}`,
    );
    return;
  }

  await incrementReferrerCredits(referrerUserId);
  await markReferralCreditApplied(referredUserId);

  await trackServerEvent("referral_credit_applied", {
    distinctId: referrerUserId,
    referredUserId,
    amountCents: credit.amountCents,
  });

  const referrerEmail = await getReferrerEmail(referrerUserId);
  if (referrerEmail) {
    void sendReferralConvertedEmail({ to: referrerEmail });
  }
}
