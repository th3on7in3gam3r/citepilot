import { NextResponse } from "next/server";
import { requireCronAuth } from "@/lib/cron/auth";
import { cronPeriodKey, recordCronDispatch } from "@/lib/cron/dispatch-log";
import { OPS_REPORT_JOB, sendWeeklyOpsReport } from "@/lib/email/ops-report";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  const authError = requireCronAuth(request);
  if (authError) return authError;

  const periodKey = cronPeriodKey(OPS_REPORT_JOB);
  const result = await sendWeeklyOpsReport();

  await recordCronDispatch({
    jobName: OPS_REPORT_JOB,
    workspaceId: null,
    periodKey,
    status: result.ok ? "sent" : "failed",
    error: result.error ?? null,
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error, stats: result.stats },
      { status: result.ok === false && result.error?.includes("not configured") ? 503 : 500 },
    );
  }

  return NextResponse.json({ ok: true, stats: result.stats });
}
