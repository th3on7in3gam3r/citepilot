import { NextResponse } from "next/server";
import { runScheduledRescanBatch } from "@/lib/audit/scheduled-rescan";
import { cronSecret } from "@/lib/email/config";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(request: Request) {
  const secret = cronSecret();
  const auth = request.headers.get("authorization");
  const querySecret = new URL(request.url).searchParams.get("secret");

  if (secret) {
    const token = auth?.replace(/^Bearer\s+/i, "") ?? querySecret;
    if (token !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const result = await runScheduledRescanBatch();
  return NextResponse.json({ ok: true, ...result });
}
