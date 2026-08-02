import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { WORKSPACE_COOKIE } from "@/lib/constants";
import { dbGet } from "@/lib/db";
import { parsePreferences } from "@/lib/settings";
import { isTotpEnabledForUser } from "@/lib/security/totp-store";
import { isTwoFactorVerified } from "@/lib/security/totp-session";

const TWO_FACTOR_EXEMPT_PREFIXES = [
  "/auth/2fa",
  "/api/auth/2fa",
  "/api/security/2fa",
  "/api/auth/sign-out",
  "/dashboard/settings/security",
];

function isTwoFactorExemptPath(pathname: string): boolean {
  return TWO_FACTOR_EXEMPT_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function workspaceIdFromRequest(request: NextRequest): string | null {
  return request.cookies.get(WORKSPACE_COOKIE)?.value?.trim() || null;
}

async function workspaceRequires2fa(workspaceId: string): Promise<boolean> {
  const row = await dbGet<{ preferences: string }>(
    `SELECT preferences FROM workspaces WHERE id = ? AND archived_at IS NULL`,
    [workspaceId],
  );
  if (!row) return false;
  return parsePreferences(row.preferences).require2faForMembers;
}

export async function userMustSetup2faForWorkspace(
  userId: string,
  request: NextRequest,
): Promise<boolean> {
  const workspaceId = workspaceIdFromRequest(request);
  if (!workspaceId) return false;
  if (!(await workspaceRequires2fa(workspaceId))) return false;
  return !(await isTotpEnabledForUser(userId));
}

export async function enforceTwoFactorAccess(
  request: NextRequest,
  pathname: string,
  userId: string | null | undefined,
): Promise<NextResponse | null> {
  if (!userId || isTwoFactorExemptPath(pathname)) return null;

  try {
    const totpEnabled = await isTotpEnabledForUser(userId);
    if (totpEnabled && !(await isTwoFactorVerified(userId, request))) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          {
            error: "Two-factor verification required",
            code: "TWO_FACTOR_REQUIRED",
            verifyUrl: "/auth/2fa",
          },
          { status: 403 },
        );
      }
      const from = `${pathname}${request.nextUrl.search}`;
      const url = new URL("/auth/2fa", request.url);
      url.searchParams.set("from", from);
      return NextResponse.redirect(url);
    }

    if (
      pathname.startsWith("/dashboard") &&
      !pathname.startsWith("/dashboard/settings/security")
    ) {
      const mustSetup = await userMustSetup2faForWorkspace(userId, request);
      if (mustSetup) {
        const url = new URL("/dashboard/settings/security", request.url);
        url.searchParams.set("require2fa", "1");
        return NextResponse.redirect(url);
      }
    }

    return null;
  } catch (error) {
    // DB outages must not 500 marketing (or any) routes via the proxy.
    console.error(
      "[2fa] enforceTwoFactorAccess failed",
      error instanceof Error ? error.message : "unknown",
    );
    return null;
  }
}
