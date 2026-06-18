import { NextResponse } from "next/server";
import { runScheduledScansBatch } from "@/lib/scans/scheduled-runner";
import { requireCronAuth } from "@/lib/cron/auth";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";
export const maxDuration = 300;

export const GET = withApiLogging(async function GET(request: Request) {
  const authError = requireCronAuth(request);
  if (authError) return authError;

  const result = await runScheduledScansBatch();
  return NextResponse.json({ ok: true, ...result });
});

export const POST = GET;
