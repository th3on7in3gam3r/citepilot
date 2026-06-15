import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { getSessionUser } from "@/lib/auth/server";
import { claimReferralForUser } from "@/lib/referrals/process";
import { REFERRAL_COOKIE } from "@/lib/referrals/constants";
import { normalizeReferralCode } from "@/lib/referrals/code";
import { ensureUserReferral } from "@/lib/referrals/store";
import { withApiLogging } from "@/lib/observability/api-log";

/** Link signed-in user to referrer from cookie or body code (OAuth signup). */
export const POST = withApiLogging(async function POST(request: Request) {
  const user = await requireApiUser(request);
  if (user instanceof NextResponse) return user;
  const userId = apiUserId(user)!;
  const sessionUser = await getSessionUser(request);
  await ensureUserReferral(userId, sessionUser?.email);

  const body = (await request.json().catch(() => ({}))) as { code?: string };
  const cookieStore = await cookies();
  const rawCode =
    body.code?.trim() ||
    cookieStore.get(REFERRAL_COOKIE)?.value ||
    "";
  const code = normalizeReferralCode(rawCode);
  if (!code) {
    return NextResponse.json({ linked: false, reason: "no_code" });
  }

  const result = await claimReferralForUser(userId, code);
  return NextResponse.json(result);
});
