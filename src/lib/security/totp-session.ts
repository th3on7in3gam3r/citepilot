import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  TOTP_CHALLENGE_COOKIE,
  TOTP_VERIFIED_COOKIE,
} from "@/lib/constants";
import {
  randomToken,
  signTotpPayload,
  verifyTotpPayload,
} from "@/lib/security/totp-crypto";

const VERIFIED_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const CHALLENGE_TTL_MS = 10 * 60 * 1000;

type VerifiedPayload = {
  userId: string;
  exp: number;
};

type ChallengePayload = {
  userId: string;
  from: string;
  exp: number;
};

function readCookieFromRequest(request: Request | undefined, name: string): string | undefined {
  if (!request) return undefined;
  const raw = request.headers.get("cookie");
  if (!raw) return undefined;
  const match = raw.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match?.[1] ? decodeURIComponent(match[1]) : undefined;
}

async function readCookie(name: string, request?: Request): Promise<string | undefined> {
  const fromRequest = readCookieFromRequest(request, name);
  if (fromRequest) return fromRequest;
  const jar = await cookies();
  return jar.get(name)?.value;
}

function parseVerifiedPayload(raw: string | undefined): VerifiedPayload | null {
  if (!raw) return null;
  const payload = verifyTotpPayload(decodeURIComponent(raw));
  if (!payload) return null;
  try {
    const parsed = JSON.parse(payload) as VerifiedPayload;
    if (!parsed.userId || !parsed.exp) return null;
    if (parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function isTwoFactorVerified(
  userId: string,
  request?: Request,
): Promise<boolean> {
  const raw = await readCookie(TOTP_VERIFIED_COOKIE, request);
  const parsed = parseVerifiedPayload(raw);
  return parsed?.userId === userId;
}

export function setTwoFactorVerifiedCookie(
  response: NextResponse,
  userId: string,
): void {
  const payload: VerifiedPayload = {
    userId,
    exp: Date.now() + VERIFIED_TTL_MS,
  };
  const signed = signTotpPayload(JSON.stringify(payload));
  response.cookies.set(TOTP_VERIFIED_COOKIE, signed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: VERIFIED_TTL_MS / 1000,
  });
}

export function clearTwoFactorCookies(response: NextResponse): void {
  response.cookies.set(TOTP_VERIFIED_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(TOTP_CHALLENGE_COOKIE, "", { path: "/", maxAge: 0 });
}

export function setTwoFactorChallengeCookie(
  response: NextResponse,
  userId: string,
  from: string,
): void {
  const payload: ChallengePayload = {
    userId,
    from: from.startsWith("/") ? from : "/dashboard",
    exp: Date.now() + CHALLENGE_TTL_MS,
  };
  const signed = signTotpPayload(JSON.stringify(payload));
  response.cookies.set(TOTP_CHALLENGE_COOKIE, signed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CHALLENGE_TTL_MS / 1000,
  });
}

export async function readTwoFactorChallenge(
  request?: Request,
): Promise<ChallengePayload | null> {
  const raw = await readCookie(TOTP_CHALLENGE_COOKIE, request);
  if (!raw) return null;
  const payload = verifyTotpPayload(decodeURIComponent(raw));
  if (!payload) return null;
  try {
    const parsed = JSON.parse(payload) as ChallengePayload;
    if (!parsed.userId || !parsed.exp) return null;
    if (parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function createTwoFactorRedirectUrl(from: string, baseUrl: string): URL {
  const url = new URL("/auth/2fa", baseUrl);
  if (from.startsWith("/")) url.searchParams.set("from", from);
  return url;
}

export { randomToken };
