import { NextResponse } from "next/server";
import { requireCronAuth } from "@/lib/cron/auth";
import { runWeeklyDigestBatch } from "@/lib/email/notifications";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";
export const maxDuration = 300;

export const GET = withApiLogging(async function GET(request: Request) {
  const authError = requireCronAuth(request);
  if (authError) return authError;

  const result = await runWeeklyDigestBatch();
  return NextResponse.json({ ok: true, ...result });
});
