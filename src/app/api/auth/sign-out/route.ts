import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { WORKSPACE_COOKIE, TOTP_VERIFIED_COOKIE, TOTP_CHALLENGE_COOKIE } from "@/lib/constants";
import { LOCALE_COOKIE_NAME } from "@/lib/i18n/locale-cookie";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

/** Dedicated sign-out — works even when the catch-all auth proxy is unavailable */
export const POST = withApiLogging(async function POST() {
  if (auth) {
    const { error } = await auth.signOut();
    if (error) {
      const status =
        typeof error === "object" &&
        error !== null &&
        "status" in error &&
        typeof error.status === "number"
          ? error.status
          : 500;
      return NextResponse.json(
        { error: error.message ?? "Sign out failed" },
        { status },
      );
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(WORKSPACE_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(TOTP_VERIFIED_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(TOTP_CHALLENGE_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(LOCALE_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return response;
});
