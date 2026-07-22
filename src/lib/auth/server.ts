import { createNeonAuth } from "@neondatabase/auth/next/server";
import { headers } from "next/headers";
import { readImpersonationCookie } from "@/lib/admin/impersonation";
import { isAdminEmail } from "@/lib/admin/emails";
import { isTotpEnabledForUser } from "@/lib/security/totp-store";
import { isTwoFactorVerified } from "@/lib/security/totp-session";

export function isNeonAuthEnabled(): boolean {
  const baseUrl = process.env.NEON_AUTH_BASE_URL?.trim();
  const secret = process.env.NEON_AUTH_COOKIE_SECRET?.trim();
  return Boolean(baseUrl && secret && secret.length >= 32);
}

function createAuth() {
  return createNeonAuth({
    baseUrl: process.env.NEON_AUTH_BASE_URL!,
    cookies: {
      secret: process.env.NEON_AUTH_COOKIE_SECRET!,
      // OAuth returns via cross-site redirect; strict cookies break session exchange.
      sameSite: "lax",
    },
  });
}

/** Neon Auth instance — only available when env is configured */
export const auth = isNeonAuthEnabled() ? createAuth() : null;

type AuthSessionPayload = {
  user?: { id?: string; name?: string | null; email?: string | null } | null;
} | null;

async function cookieHeaderFromRequest(
  request?: Request,
): Promise<string | undefined> {
  if (request) {
    return request.headers.get("cookie") ?? undefined;
  }
  const store = await headers();
  return store.get("cookie") ?? undefined;
}

/**
 * Resolve session preferring the signed session_data cookie cache.
 * Forcing disableCookieCache:true breaks API routes when Neon Auth upstream
 * is down/misconfigured while the browser still has a valid session cookie
 * (UI looks signed-in, /api/* returns 401).
 */
async function loadAuthSession(request?: Request): Promise<AuthSessionPayload> {
  if (!auth) return null;

  const cookie = await cookieHeaderFromRequest(request);
  const withCookie = cookie
    ? { fetchOptions: { headers: { cookie } } }
    : {};

  try {
    // Cookie cache via next/headers (same path as /api/auth/get-session).
    const cached = await auth.getSession(withCookie);
    if (cached.data?.user?.id) return cached.data as AuthSessionPayload;
  } catch {
    /* try upstream */
  }

  try {
    const fresh = await auth.getSession({
      query: { disableCookieCache: true },
      ...withCookie,
    });
    return (fresh.data as AuthSessionPayload) ?? null;
  } catch {
    return null;
  }
}

async function gateSessionUserId(
  userId: string | null,
  request?: Request,
): Promise<string | null> {
  if (!userId) return null;
  if (!(await isTotpEnabledForUser(userId))) return userId;
  if (await isTwoFactorVerified(userId, request)) return userId;
  return null;
}

export async function getSessionUserId(request?: Request): Promise<string | null> {
  const impersonation = await readImpersonationCookie(request);
  if (impersonation) {
    const real = await getRealSessionUser(request);
    if (
      real?.id === impersonation.adminId &&
      isAdminEmail(real.email)
    ) {
      return impersonation.targetUserId;
    }
  }

  try {
    const session = await loadAuthSession(request);
    return gateSessionUserId(session?.user?.id ?? null, request);
  } catch (error) {
    console.error(
      "[auth] getSessionUserId failed",
      error instanceof Error ? error.message : "unknown",
    );
    return null;
  }
}

export async function getSessionUser(request?: Request): Promise<{
  id: string;
  name: string;
  email: string;
} | null> {
  const impersonation = await readImpersonationCookie(request);
  if (impersonation) {
    const real = await getRealSessionUser(request);
    if (
      real?.id === impersonation.adminId &&
      isAdminEmail(real.email)
    ) {
      return {
        id: impersonation.targetUserId,
        name: "",
        email: impersonation.targetEmail,
      };
    }
  }

  try {
    const session = await loadAuthSession(request);
    const user = session?.user;
    if (!user?.id) return null;
    const userId = await gateSessionUserId(user.id, request);
    if (!userId) return null;
    return {
      id: userId,
      name: user.name ?? "",
      email: user.email ?? "",
    };
  } catch (error) {
    console.error(
      "[auth] getSessionUser failed",
      error instanceof Error ? error.message : "unknown",
    );
    return null;
  }
}

/** Real signed-in user — ignores impersonation (for admin checks). */
export async function getRealSessionUser(request?: Request): Promise<{
  id: string;
  name: string;
  email: string;
} | null> {
  try {
    const session = await loadAuthSession(request);
    const user = session?.user;
    if (!user?.id) return null;
    return {
      id: user.id,
      name: user.name ?? "",
      email: user.email ?? "",
    };
  } catch (error) {
    // Neon Auth outages must not 500 marketing pages (proxy calls this every request).
    console.error(
      "[auth] getRealSessionUser failed",
      error instanceof Error ? error.message : "unknown",
    );
    return null;
  }
}
