import { NextResponse } from "next/server";
import { requireCronAuth } from "@/lib/cron/auth";
import { withApiLogging } from "@/lib/observability/api-log";
import { runDueUptimeChecks } from "@/lib/uptime/runner";

export const runtime = "nodejs";
export const maxDuration = 120;

export const GET = withApiLogging(async function GET(request: Request) {
  const authError = requireCronAuth(request);
  if (authError) return authError;

  const result = await runDueUptimeChecks(50);
  return NextResponse.json({ ok: true, ...result });
});

export const POST = GET;
