import { NextResponse } from "next/server";
import { getSessionUserId, isNeonAuthEnabled } from "@/lib/auth/server";

/** Returns user id, or 401 response when Neon Auth is enabled and user is signed out */
export async function requireApiUser(
  request?: Request,
): Promise<{ userId: string | null } | NextResponse> {
  if (!isNeonAuthEnabled()) {
    return { userId: null };
  }

  try {
    const userId = await getSessionUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Sign in required", signInUrl: "/auth/sign-in" },
        { status: 401 },
      );
    }

    return { userId };
  } catch (error) {
    console.error("[auth] getSession failed", error);
    return NextResponse.json(
      { error: "Sign in required", signInUrl: "/auth/sign-in" },
      { status: 401 },
    );
  }
}

export function apiUserId(
  result: { userId: string | null } | NextResponse,
): string | null {
  if (result instanceof NextResponse) return null;
  return result.userId;
}

/** Use when auth is enabled and a non-null user id is mandatory */
export function requireApiUserId(
  result: { userId: string | null } | NextResponse,
): string | NextResponse {
  if (result instanceof NextResponse) return result;
  if (!result.userId) {
    return NextResponse.json(
      { error: "Sign in required", signInUrl: "/auth/sign-in" },
      { status: 401 },
    );
  }
  return result.userId;
}
