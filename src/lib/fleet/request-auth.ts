import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import {
  FLEET_UPGRADE_MESSAGE,
  userHasFleetAccess,
} from "@/lib/billing/access";
import {
  assertWorkspaceScope,
  verifyFleetApiKey,
} from "@/lib/fleet/api-keys";
import { apiErrorResponse } from "@/lib/fleet/api-error";
import {
  FLEET_API_RATE_LIMIT_PER_HOUR,
  FLEET_API_RATE_LIMIT_PER_MINUTE,
  isFleetApiKeySecret,
} from "@/lib/fleet/constants";
import { checkFleetRateLimit, rateLimitHeaders } from "@/lib/fleet/rate-limit";
import { checkMinuteRateLimit } from "@/lib/rate-limit/minute";

export type FleetAuthContext = {
  userId: string;
  viaApiKey: boolean;
  apiKeyId?: string;
  workspaceId?: string | null;
};

function extractBearerApiKey(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice(7).trim();
    if (isFleetApiKeySecret(token)) return token;
  }
  const header = request.headers.get("x-api-key");
  if (header && isFleetApiKeySecret(header.trim())) return header.trim();
  return null;
}

function mergeRateLimitHeaders(
  minute: Awaited<ReturnType<typeof checkMinuteRateLimit>>,
  hour: Awaited<ReturnType<typeof checkFleetRateLimit>>,
): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(hour.limit),
    "X-RateLimit-Remaining": String(Math.min(minute.remaining, hour.remaining)),
    "X-RateLimit-Reset": hour.resetAt,
    "X-RateLimit-Limit-Minute": String(minute.limit),
    "X-RateLimit-Remaining-Minute": String(minute.remaining),
  };
}

async function applyFleetRateLimits(
  subjectBase: string,
): Promise<NextResponse | null> {
  const minute = await checkMinuteRateLimit(
    `${subjectBase}:minute`,
    FLEET_API_RATE_LIMIT_PER_MINUTE,
  );
  if (!minute.allowed) {
    return NextResponse.json(
      {
        error: "Fleet API rate limit exceeded (per minute)",
        code: "RATE_LIMIT",
        status: 429,
        resetAt: minute.resetAt,
      },
      { status: 429, headers: mergeRateLimitHeaders(minute, minute) },
    );
  }

  const hour = await checkFleetRateLimit(subjectBase, FLEET_API_RATE_LIMIT_PER_HOUR);
  if (!hour.allowed) {
    return NextResponse.json(
      {
        error: "Fleet API rate limit exceeded (per hour)",
        code: "RATE_LIMIT",
        status: 429,
        resetAt: hour.resetAt,
      },
      { status: 429, headers: mergeRateLimitHeaders(minute, hour) },
    );
  }

  return null;
}

export async function requireFleetAccess(
  request: Request,
): Promise<FleetAuthContext | NextResponse> {
  const apiKeySecret = extractBearerApiKey(request);
  if (apiKeySecret) {
    const verified = await verifyFleetApiKey(apiKeySecret);
    if (!verified) {
      return apiErrorResponse("Invalid API key", "UNAUTHORIZED", 401);
    }
    if (!(await userHasFleetAccess(verified.userId))) {
      return apiErrorResponse(FLEET_UPGRADE_MESSAGE, "FLEET_REQUIRED", 403);
    }

    const rateBlocked = await applyFleetRateLimits(`key:${verified.keyId}`);
    if (rateBlocked) return rateBlocked;

    return {
      userId: verified.userId,
      viaApiKey: true,
      apiKeyId: verified.keyId,
      workspaceId: verified.workspaceId,
    };
  }

  const user = await requireApiUser(request);
  if (user instanceof NextResponse) return user;
  const userId = apiUserId(user);
  if (!userId) {
    return apiErrorResponse("Sign in required", "UNAUTHORIZED", 401);
  }
  if (!(await userHasFleetAccess(userId))) {
    return apiErrorResponse(FLEET_UPGRADE_MESSAGE, "FLEET_REQUIRED", 403);
  }

  const rateBlocked = await applyFleetRateLimits(`user:${userId}`);
  if (rateBlocked) return rateBlocked;

  return { userId, viaApiKey: false };
}

export function requireWorkspaceAccess(
  auth: FleetAuthContext,
  workspaceId: string,
): NextResponse | null {
  if (
    auth.workspaceId &&
    !assertWorkspaceScope(auth.workspaceId, workspaceId)
  ) {
    return apiErrorResponse(
      "API key is scoped to a different workspace",
      "WORKSPACE_SCOPE",
      403,
    );
  }
  return null;
}

export function withFleetHeaders(
  response: NextResponse,
  auth: FleetAuthContext,
): NextResponse {
  response.headers.set("X-CitePilot-Auth", auth.viaApiKey ? "api-key" : "session");
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export { rateLimitHeaders };
