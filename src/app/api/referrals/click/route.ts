import { NextResponse } from "next/server";
import { recordReferralLinkClick } from "@/lib/referrals/process";
import { normalizeReferralCode } from "@/lib/referrals/code";
import { withApiLogging } from "@/lib/observability/api-log";

export const POST = withApiLogging(async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { code?: string };
  const code = body.code ? normalizeReferralCode(body.code) : null;
  if (!code) {
    return NextResponse.json({ error: "Invalid referral code" }, { status: 400 });
  }

  const result = await recordReferralLinkClick(code);
  if (!result.ok) {
    return NextResponse.json({ error: "Unknown referral code" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
});
