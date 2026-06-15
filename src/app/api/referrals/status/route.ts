import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { getSessionUser } from "@/lib/auth/server";
import { userHasPilotAccess } from "@/lib/billing/access";
import { appBaseUrl } from "@/lib/stripe/config";
import { buildReferralDashboardStats } from "@/lib/referrals/store";
import { withApiLogging } from "@/lib/observability/api-log";

/** Referral dashboard stats — Pilot & Fleet only. */
export const GET = withApiLogging(async function GET(request: Request) {
  const user = await requireApiUser(request);
  if (user instanceof NextResponse) return user;
  const userId = apiUserId(user)!;

  if (!(await userHasPilotAccess(userId))) {
    return NextResponse.json({ error: "Pilot or Fleet required" }, { status: 403 });
  }

  const sessionUser = await getSessionUser(request);
  const stats = await buildReferralDashboardStats(
    userId,
    appBaseUrl(),
    sessionUser?.email,
  );

  return NextResponse.json(stats);
});
