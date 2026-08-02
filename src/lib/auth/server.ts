import { createNeonAuth } from "@neondatabase/auth/next/server";
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

/**
 * Resolve session preferring the signed session_data cookie cache.
 * Neon Auth's getSession() reads cookies via next/headers — do not pass a
 * stripped Cookie-only fetchOptions (the SDK ignores it for upstream anyway).
 * Forcing disableCookieCache as boolean true does not bypass the SDK cache
 * wrapper (it checks the string "true"); prefer the default cache path so
 * APIs keep working when Neon Auth upstream is briefly unreachable.
 */
async function loadAuthSession(): Promise<AuthSessionPayload> {
  if (!auth) return null;

  try {
    const cached = await auth.getSession();
    const userId =
      cached.data?.user?.id ??
      (cached.data as { session?: { userId?: string } } | null)?.session?.userId;
    if (userId) {
      const data = cached.data as AuthSessionPayload;
      if (data?.user?.id) return data;
      // Normalize session-only payloads to the shape callers expect.
      return {
        user: {
          id: userId,
          name: cached.data?.user?.name ?? null,
          email: cached.data?.user?.email ?? null,
        },
      };
    }
  } catch {
    /* try upstream without cache */
  }

  try {
    const fresh = await auth.getSession({
      query: { disableCookieCache: "true" },
    });
    const data = fresh.data as AuthSessionPayload;
    if (data?.user?.id) return data;
    const sessionUserId = (
      fresh.data as { session?: { userId?: string } } | null
    )?.session?.userId;
    if (sessionUserId) {
      return {
        user: {
          id: sessionUserId,
          name: data?.user?.name ?? null,
          email: data?.user?.email ?? null,
        },
      };
    }
    return data ?? null;
  } catch {
    return null;
  }
}

async function gateSessionUserId(
  userId: string | null,
  request?: Request,
): Promise<string | null> {
  if (!userId) return null;
  try {
    if (!(await isTotpEnabledForUser(userId))) return userId;
    if (await isTwoFactorVerified(userId, request)) return userId;
    return null;
  } catch (error) {
    // DB blips must not look like "signed out" (401) on every API call.
    console.error(
      "[auth] TOTP gate failed open",
      error instanceof Error ? error.message : "unknown",
    );
    return userId;
  }
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
    const session = await loadAuthSession();
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
    const session = await loadAuthSession();
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
    const session = await loadAuthSession();
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
