import { NextResponse } from "next/server";
import { isGscConfigured } from "@/lib/gsc/config";

export const runtime = "nodejs";

/** Public read: whether GSC OAuth env vars are present (same check as /api/health). */
export async function GET() {
  return NextResponse.json({ configured: isGscConfigured() });
}
