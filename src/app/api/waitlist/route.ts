import { NextResponse } from "next/server";
import { WAITLIST_RATE_LIMIT_PER_HOUR } from "@/lib/rate-limit/constants";
import { rateLimitHeaders } from "@/lib/rate-limit/hourly";
import {
  clientIpFromRequest,
  enforceHourlyRateLimit,
} from "@/lib/rate-limit/request";
import { addWaitlistEmail } from "@/lib/server/workspace";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const rate = await enforceHourlyRateLimit(
      `waitlist:ip:${clientIpFromRequest(request)}`,
      WAITLIST_RATE_LIMIT_PER_HOUR,
      `Waitlist signup limit reached (${WAITLIST_RATE_LIMIT_PER_HOUR}/hour).`,
    );
    if (rate instanceof NextResponse) return rate;

    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    try {
      const result = await addWaitlistEmail(email);
      return NextResponse.json(result, { headers: rateLimitHeaders(rate) });
    } catch {
      return NextResponse.json({ ok: true, id: "existing" });
    }
  } catch (error) {
    console.error("POST /api/waitlist", error);
    return NextResponse.json({ error: "Failed to join waitlist" }, { status: 500 });
  }
}
