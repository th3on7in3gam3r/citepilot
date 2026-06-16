import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server";
import {
  getDomainScoreProfile,
  getOrCreateVerificationToken,
} from "@/lib/score/domain-profiles";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ domain: string }> };

export const POST = withApiLogging(async function POST(request: Request, ctx: Ctx) {
  const session = await getSessionUser(request);
  if (!session) {
    return NextResponse.json({ error: "Sign in to claim this page" }, { status: 401 });
  }

  const { domain } = await ctx.params;
  const profile = await getDomainScoreProfile(domain);
  if (profile?.verifiedAt && profile.claimedByUserId === session.id) {
    return NextResponse.json({
      verified: true,
      token: profile.verificationToken,
    });
  }

  const token = await getOrCreateVerificationToken(domain);
  if (!token) {
    return NextResponse.json({ error: "Invalid domain" }, { status: 400 });
  }

  return NextResponse.json({ token, verified: false });
});
