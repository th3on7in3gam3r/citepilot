import { cookies } from "next/headers";
import { trackServerEvent } from "@/lib/analytics/track-server";
import { BADGE_REF_COOKIE } from "@/lib/widget/constants";

/** Fire badge_referral_signup when user signed up after clicking a badge CTA. */
export async function trackBadgeReferralSignup(
  userId: string,
  badgeDomainFromBody?: string,
): Promise<{ tracked: boolean; badgeDomain: string | null }> {
  const cookieStore = await cookies();
  const raw =
    badgeDomainFromBody?.trim() ||
    cookieStore.get(BADGE_REF_COOKIE)?.value ||
    "";
  const badgeDomain = raw ? decodeURIComponent(raw).toLowerCase() : "";
  if (!badgeDomain || !badgeDomain.includes(".")) {
    return { tracked: false, badgeDomain: null };
  }

  await trackServerEvent("badge_referral_signup", {
    badge_domain: badgeDomain,
    user_id: userId,
    distinctId: userId,
  });

  cookieStore.delete(BADGE_REF_COOKIE);
  return { tracked: true, badgeDomain };
}
