import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import {
  WORKSPACE_COOKIE,
  TOTP_VERIFIED_COOKIE,
  TOTP_CHALLENGE_COOKIE,
} from "@/lib/constants";
import { LOCALE_COOKIE_NAME } from "@/lib/i18n/locale-cookie";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

const APP_COOKIES_TO_CLEAR = [
  WORKSPACE_COOKIE,
  TOTP_VERIFIED_COOKIE,
  TOTP_CHALLENGE_COOKIE,
  LOCALE_COOKIE_NAME,
  "citepilot_2fa_pending",
] as const;

function shouldClearCookie(name: string): boolean {
  if ((APP_COOKIES_TO_CLEAR as readonly string[]).includes(name)) return true;
  const lower = name.toLowerCase();
  return (
    lower.includes("session") ||
    lower.includes("better-auth") ||
    lower.includes("neon_auth") ||
    lower.includes("neonauth")
  );
}

function clearAuthCookies(request: Request, response: NextResponse): void {
  for (const name of APP_COOKIES_TO_CLEAR) {
    response.cookies.set(name, "", { path: "/", maxAge: 0 });
  }

  const raw = request.headers.get("cookie") ?? "";
  for (const part of raw.split(";")) {
    const name = part.split("=")[0]?.trim();
    if (!name || !shouldClearCookie(name)) continue;
    response.cookies.set(name, "", { path: "/", maxAge: 0 });
  }
}

async function bestEffortNeonSignOut(): Promise<void> {
  if (!auth) return;
  try {
    await Promise.race([
      auth.signOut(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Neon Auth signOut timed out")), 5000);
      }),
    ]);
  } catch (error) {
    console.error(
      "[auth] signOut best-effort failed",
      error instanceof Error ? error.message : "unknown",
    );
  }
}

/**
 * Dedicated sign-out — always clears local cookies even when Neon Auth
 * upstream is misconfigured or timing out (so users are not stuck signed in).
 */
export const POST = withApiLogging(async function POST(request: Request) {
  await bestEffortNeonSignOut();

  const response = NextResponse.json({ ok: true });
  clearAuthCookies(request, response);
  return response;
});
