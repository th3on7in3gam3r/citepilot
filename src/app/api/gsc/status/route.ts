import { NextResponse } from "next/server";
import { isGscConfigured } from "@/lib/gsc/config";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

/** Public read: whether GSC OAuth env vars are present (same check as /api/health). */
export const GET = withApiLogging(async function GET() {
  return NextResponse.json({ configured: isGscConfigured() });
});
