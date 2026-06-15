import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { trackBadgeReferralSignup } from "@/lib/widget/track-referral";
import { withApiLogging } from "@/lib/observability/api-log";

/** Attribute signup to a GEO badge referral (cookie set by ?ref=badge). */
export const POST = withApiLogging(async function POST(request: Request) {
  const user = await requireApiUser(request);
  if (user instanceof NextResponse) return user;
  const userId = apiUserId(user)!;

  const body = (await request.json().catch(() => ({}))) as {
    badgeDomain?: string;
  };

  const result = await trackBadgeReferralSignup(userId, body.badgeDomain);
  return NextResponse.json(result);
});
