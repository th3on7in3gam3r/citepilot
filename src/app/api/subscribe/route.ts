import { NextResponse } from "next/server";
import { subscribeToNewsletter } from "@/lib/email/subscribe";
import { SUBSCRIBE_RATE_LIMIT_PER_HOUR } from "@/lib/rate-limit/constants";
import { rateLimitHeaders } from "@/lib/rate-limit/hourly";
import {
  clientIpFromRequest,
  enforceHourlyRateLimit,
} from "@/lib/rate-limit/request";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

export const POST = withApiLogging(async function POST(request: Request) {
  try {
    const rate = await enforceHourlyRateLimit(
      `subscribe:ip:${clientIpFromRequest(request)}`,
      SUBSCRIBE_RATE_LIMIT_PER_HOUR,
      "Newsletter signup limit reached (1/hour).",
    );
    if (rate instanceof NextResponse) return rate;

    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const result = await subscribeToNewsletter(email);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error ?? "Subscribe failed" },
        { status: 503, headers: rateLimitHeaders(rate) },
      );
    }

    return NextResponse.json(
      { ok: true, message: "You're in — check your inbox." },
      { headers: rateLimitHeaders(rate) },
    );
  } catch (error) {
    console.error("POST /api/subscribe", error);
    return NextResponse.json({ error: "Subscribe failed" }, { status: 500 });
  }
});
