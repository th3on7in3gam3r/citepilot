import { NextResponse } from "next/server";
import {
  checkHourlyRateLimit,
  rateLimitHeaders,
  type RateLimitResult,
} from "@/lib/rate-limit/hourly";

/** Best-effort client IP for abuse limits (Vercel / reverse-proxy headers). */
export function clientIpFromRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}

export async function enforceHourlyRateLimit(
  subject: string,
  limit: number,
  errorMessage: string,
): Promise<NextResponse | RateLimitResult> {
  const rate = await checkHourlyRateLimit(subject, limit);
  if (!rate.allowed) {
    return NextResponse.json(
      {
        error: errorMessage,
        code: "RATE_LIMIT",
        resetAt: rate.resetAt,
      },
      { status: 429, headers: rateLimitHeaders(rate) },
    );
  }
  return rate;
}
