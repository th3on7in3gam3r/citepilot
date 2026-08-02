import { NextResponse } from "next/server";
import { broadcastProductHuntEmail } from "@/lib/launch/broadcast-emails";
import { requireCronAuth } from "@/lib/cron/auth";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";
export const maxDuration = 300;

/** POST /api/cron/ph-prelaunch-email — send 24h before launch (cron auth). */
export const POST = withApiLogging(async function POST(request: Request) {
  const authError = requireCronAuth(request);
  if (authError) return authError;

  const result = await broadcastProductHuntEmail("ph_prelaunch");
  return NextResponse.json({ ok: true, ...result });
});

export const GET = POST;
