import { createNeonAuth } from "@neondatabase/auth/next/server";
import { headers } from "next/headers";

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
