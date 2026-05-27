import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import {
  FLEET_UPGRADE_MESSAGE,
  userHasFleetAccess,
} from "@/lib/billing/access";
import { verifyFleetApiKey } from "@/lib/fleet/api-keys";
import {
  checkFleetRateLimit,
  rateLimitHeaders,
} from "@/lib/fleet/rate-limit";

export type FleetAuthContext = {
  userId: string;
  viaApiKey: boolean;
  apiKeyId?: string;
};

function extractBearerApiKey(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice(7).trim();
    if (token.startsWith("cp_fleet_")) return token;
  }
  const header = request.headers.get("x-api-key");
  if (header?.startsWith("cp_fleet_")) return header.trim();
  return null;
}

export async function requireFleetAccess(
  request: Request,
): Promise<FleetAuthContext | NextResponse> {
  const apiKeySecret = extractBearerApiKey(request);
  if (apiKeySecret) {
    const verified = await verifyFleetApiKey(apiKeySecret);
    if (!verified) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }
    if (!(await userHasFleetAccess(verified.userId))) {
      return NextResponse.json(
        { error: FLEET_UPGRADE_MESSAGE, code: "FLEET_REQUIRED" },
        { status: 403 },
      );
    }
    const rate = await checkFleetRateLimit(`key:${verified.keyId}`);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: "Fleet API rate limit exceeded",
          code: "RATE_LIMIT",
          resetAt: rate.resetAt,
        },
        { status: 429, headers: rateLimitHeaders(rate) },
      );
    }
    return {
      userId: verified.userId,
      viaApiKey: true,
      apiKeyId: verified.keyId,
    };
  }

  const user = await requireApiUser(request);
  if (user instanceof NextResponse) return user;
  const userId = apiUserId(user);
  if (!userId) {
    return NextResponse.json(
      { error: "Sign in required", signInUrl: "/auth/sign-in" },
      { status: 401 },
    );
  }
  if (!(await userHasFleetAccess(userId))) {
    return NextResponse.json(
      { error: FLEET_UPGRADE_MESSAGE, code: "FLEET_REQUIRED" },
      { status: 403 },
    );
  }

  const rate = await checkFleetRateLimit(`user:${userId}`);
  if (!rate.allowed) {
    return NextResponse.json(
      {
        error: "Fleet API rate limit exceeded",
        code: "RATE_LIMIT",
        resetAt: rate.resetAt,
      },
      { status: 429, headers: rateLimitHeaders(rate) },
    );
  }

  return { userId, viaApiKey: false };
}
