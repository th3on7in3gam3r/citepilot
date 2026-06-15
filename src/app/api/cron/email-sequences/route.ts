import { NextResponse } from "next/server";
import { requireCronAuth } from "@/lib/cron/auth";
import { processEmailSequenceQueue } from "@/lib/email/sequences/engine";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

/** GET /api/cron/email-sequences — send due sequence emails. */
export const GET = withApiLogging(async function GET(request: Request) {
  const auth = requireCronAuth(request);
  if (auth) return auth;

  const result = await processEmailSequenceQueue();
  return NextResponse.json({ ok: true, ...result });
});
