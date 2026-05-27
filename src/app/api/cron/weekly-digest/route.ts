import { NextResponse } from "next/server";
import { requireCronAuth } from "@/lib/cron/auth";
import { runWeeklyDigestBatch } from "@/lib/email/notifications";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(request: Request) {
  const authError = requireCronAuth(request);
  if (authError) return authError;

  const result = await runWeeklyDigestBatch();
  return NextResponse.json({ ok: true, ...result });
}
