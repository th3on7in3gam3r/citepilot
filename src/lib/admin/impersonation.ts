import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const IMPERSONATION_COOKIE = "citepilot_impersonate";
export const IMPERSONATION_MAX_AGE_MS = 30 * 60 * 1000;

export type ImpersonationPayload = {
  adminId: string;
  adminEmail: string;
  targetUserId: string;
  targetEmail: string;
  exp: number;
};

function signingSecret(): string | null {
  const secret =
    process.env.NEON_AUTH_COOKIE_SECRET?.trim() ||
    process.env.CMS_ENCRYPTION_KEY?.trim();
  return secret || null;
}

function sign(payload: string): string | null {
  const secret = signingSecret();
  if (!secret) return null;
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function encodeImpersonationToken(
  input: Omit<ImpersonationPayload, "exp">,
): string | null {
  const payload: ImpersonationPayload = {
    ...input,
    exp: Date.now() + IMPERSONATION_MAX_AGE_MS,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(body);
  if (!signature) return null;
  return `${body}.${signature}`;
}

export function parseImpersonationToken(token: string): ImpersonationPayload | null {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = sign(body);
  if (!expected) return null;
  try {
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as ImpersonationPayload;
    if (!payload.exp || payload.exp < Date.now()) return null;
    if (!payload.targetUserId || !payload.adminId) return null;
    return payload;
  } catch {
    return null;
  }
}

function readCookieFromHeader(request: Request, name: string): string | undefined {
  const header = request.headers.get("cookie");
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    if (trimmed.slice(0, eq) === name) return trimmed.slice(eq + 1);
  }
  return undefined;
}

export async function readImpersonationCookie(
  request?: Request,
): Promise<ImpersonationPayload | null> {
  let token: string | undefined;
  if (request) {
    token = readCookieFromHeader(request, IMPERSONATION_COOKIE);
  } else {
    const jar = await cookies();
    token = jar.get(IMPERSONATION_COOKIE)?.value;
  }
  if (!token) return null;
  return parseImpersonationToken(token);
}

export function buildImpersonationCookie(
  input: Omit<ImpersonationPayload, "exp">,
): { name: string; value: string; maxAge: number } | null {
  const value = encodeImpersonationToken(input);
  if (!value) return null;
  return {
    name: IMPERSONATION_COOKIE,
    value,
    maxAge: Math.floor(IMPERSONATION_MAX_AGE_MS / 1000),
  };
}

export function clearImpersonationCookie(): {
  name: string;
  value: string;
  maxAge: number;
} {
  return { name: IMPERSONATION_COOKIE, value: "", maxAge: 0 };
}
