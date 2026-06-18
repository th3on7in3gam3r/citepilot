"use server";

import { cookies } from "next/headers";
import { auth } from "@/lib/auth/server";
import { passwordMeetsRequirements } from "@/lib/auth/password-requirements";
import { claimReferralForUser } from "@/lib/referrals/process";
import { REFERRAL_COOKIE } from "@/lib/referrals/constants";
import { ensureUserReferral } from "@/lib/referrals/store";
import {
  triggerFreeOnboarding,
  triggerProductHuntWelcome,
} from "@/lib/email/sequences/engine";
import { trackBadgeReferralSignup } from "@/lib/widget/track-referral";
import { trackServerEvent } from "@/lib/analytics/track-server";
import { persistSignupAttribution } from "@/lib/launch/signup-attribution";
import {
  isProductHuntAttribution,
  parseAttributionCookie,
  PH_ATTRIBUTION_COOKIE,
} from "@/lib/launch/utm";
import { redirect } from "next/navigation";

function cleanDomain(raw: string): string {
  return raw
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "")
    .trim()
    .toLowerCase();
}

export async function signUpWithEmail(
  _prev: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  if (!auth) {
    return { error: "Neon Auth is not configured on this server" };
  }

  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const domain = cleanDomain((formData.get("domain") as string) ?? "");

  if (!email) {
    return { error: "Email is required" };
  }
  if (!domain || !domain.includes(".")) {
    return { error: "Enter a valid domain (e.g. yourcompany.com)" };
  }
  if (!passwordMeetsRequirements(password)) {
    return {
      error: "Password must be at least 8 characters with a letter and a number",
    };
  }

  const { data, error } = await auth.signUp.email({
    email,
    name: (formData.get("name") as string) || email.split("@")[0] || "User",
    password,
  });

  if (error) {
    return { error: error.message ?? "Could not create account" };
  }

  const userId = data?.user?.id;
  if (userId) {
    await ensureUserReferral(userId, email);
    const cookieStore = await cookies();
    const refCode = cookieStore.get(REFERRAL_COOKIE)?.value;
    if (refCode) {
      await claimReferralForUser(userId, refCode);
    }
    await trackBadgeReferralSignup(userId);

    const phRaw = cookieStore.get(PH_ATTRIBUTION_COOKIE)?.value;
    const attribution = parseAttributionCookie(phRaw);
    await persistSignupAttribution(userId, attribution);

    const userName = (formData.get("name") as string) || email.split("@")[0] || "User";
    const fromProductHunt = isProductHuntAttribution(attribution);
    if (fromProductHunt) {
      await triggerProductHuntWelcome(userId, email, userName);
      await trackServerEvent("ph_launch_signup_completed", {
        distinctId: userId,
        utm_source: attribution?.source,
        utm_campaign: attribution?.campaign,
        utm_medium: attribution?.medium,
      });
    } else {
      await triggerFreeOnboarding(userId, email);
    }

    const phQuery = fromProductHunt ? "&ph_signup=1" : "";
    redirect(`/start?domain=${encodeURIComponent(domain)}${phQuery}`);
  }

  redirect(`/start?domain=${encodeURIComponent(domain)}`);
}
