import { NextResponse } from "next/server";
import { getRealSessionUser } from "@/lib/auth/server";
import { withApiLogging } from "@/lib/observability/api-log";
import { logSecurityEvent } from "@/lib/security/security-audit";
import { clearTwoFactorCookies } from "@/lib/security/totp-session";
import { disableTotpForUser } from "@/lib/security/totp-store";

export const runtime = "nodejs";

export const POST = withApiLogging(async function POST(request: Request) {
  const session = await getRealSessionUser(request);
  if (!session?.id || !session.email) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { token?: string } | null;
  const token = body?.token?.trim();
  if (!token) {
    return NextResponse.json({ error: "Enter your current authenticator code" }, { status: 400 });
  }

  const result = await disableTotpForUser(session.id, token);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await logSecurityEvent({
    userId: session.id,
    email: session.email,
    action: "2fa_disabled",
  });

  const response = NextResponse.json({ ok: true });
  clearTwoFactorCookies(response);
  return response;
});
