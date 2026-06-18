import { NextResponse } from "next/server";
import { getRealSessionUser } from "@/lib/auth/server";
import { withApiLogging } from "@/lib/observability/api-log";
import {
  readTwoFactorChallenge,
  setTwoFactorChallengeCookie,
  setTwoFactorVerifiedCookie,
} from "@/lib/security/totp-session";
import { verifyTotpOrBackup } from "@/lib/security/totp-store";

export const runtime = "nodejs";

export const POST = withApiLogging(async function POST(request: Request) {
  const session = await getRealSessionUser(request);
  if (!session?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    token?: string;
    from?: string;
  } | null;
  const token = body?.token?.trim();
  if (!token) {
    return NextResponse.json({ error: "Enter your verification code" }, { status: 400 });
  }

  const result = await verifyTotpOrBackup(session.id, token);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const challenge = await readTwoFactorChallenge(request);
  const from =
    challenge?.userId === session.id
      ? challenge.from
      : body?.from?.startsWith("/")
        ? body.from
        : "/dashboard";

  const response = NextResponse.json({ ok: true, redirectTo: from });
  setTwoFactorVerifiedCookie(response, session.id);
  response.cookies.set("citepilot_2fa_pending", "", { path: "/", maxAge: 0 });
  return response;
});

export const GET = withApiLogging(async function GET(request: Request) {
  const session = await getRealSessionUser(request);
  if (!session?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const url = new URL(request.url);
  const from = url.searchParams.get("from") ?? "/dashboard";
  const response = NextResponse.json({
    userId: session.id,
    email: session.email,
    from: from.startsWith("/") ? from : "/dashboard",
  });
  setTwoFactorChallengeCookie(response, session.id, from.startsWith("/") ? from : "/dashboard");
  return response;
});
