import { createNeonAuth } from "@neondatabase/auth/next/server";
import { headers } from "next/headers";
import { readImpersonationCookie } from "@/lib/admin/impersonation";
import { isAdminEmail } from "@/lib/admin/emails";

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

async function cookieHeaderFromRequest(
  request?: Request,
): Promise<string | undefined> {
  if (request) {
    return request.headers.get("cookie") ?? undefined;
  }
  const store = await headers();
  return store.get("cookie") ?? undefined;
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

  if (!auth) return null;

  const cookie = await cookieHeaderFromRequest(request);
  const { data: session } = await auth.getSession({
    query: { disableCookieCache: true },
    ...(cookie
      ? { fetchOptions: { headers: { cookie } } }
      : {}),
  });

  return session?.user?.id ?? null;
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

  if (!auth) return null;

  const cookie = await cookieHeaderFromRequest(request);
  const { data: session } = await auth.getSession({
    query: { disableCookieCache: true },
    ...(cookie
      ? { fetchOptions: { headers: { cookie } } }
      : {}),
  });

  const user = session?.user;
  if (!user?.id) return null;
  return {
    id: user.id,
    name: user.name ?? "",
    email: user.email ?? "",
  };
}

/** Real signed-in user — ignores impersonation (for admin checks). */
export async function getRealSessionUser(request?: Request): Promise<{
  id: string;
  name: string;
  email: string;
} | null> {
  if (!auth) return null;

  const cookie = await cookieHeaderFromRequest(request);
  const { data: session } = await auth.getSession({
    query: { disableCookieCache: true },
    ...(cookie
      ? { fetchOptions: { headers: { cookie } } }
      : {}),
  });

  const user = session?.user;
  if (!user?.id) return null;
  return {
    id: user.id,
    name: user.name ?? "",
    email: user.email ?? "",
  };
}
