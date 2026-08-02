import { NextResponse } from "next/server";
import { processScheduledDeletions } from "@/lib/account/deletion";
import { requireCronAuth } from "@/lib/cron/auth";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

/** Purge user data after the 7-day cancellation window. */
export const GET = withApiLogging(async function GET(request: Request) {
  const auth = requireCronAuth(request);
  if (auth) return auth;

  const result = await processScheduledDeletions();
  return NextResponse.json({ ok: true, ...result });
});
