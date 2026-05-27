import { NextResponse } from "next/server";
import { cronSecret } from "@/lib/email/config";
import { isProductionRuntime } from "@/lib/env/runtime";

export function requireCronAuth(request: Request): NextResponse | null {
  const secret = cronSecret();
  const isProd = isProductionRuntime();

  if (isProd && !secret) {
    console.error(
      "[cron] CRON_SECRET is required in production but is not set",
    );
    return NextResponse.json(
      { error: "Cron authentication is not configured" },
      { status: 503 },
    );
  }

  if (!secret) {
    console.warn("[cron] CRON_SECRET unset — allowing request (non-production only)");
    return null;
  }

  const auth = request.headers.get("authorization");
  const querySecret = new URL(request.url).searchParams.get("secret");
  const token = auth?.replace(/^Bearer\s+/i, "") ?? querySecret;

  if (token !== secret) {
    console.warn("[cron] Unauthorized cron request");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
