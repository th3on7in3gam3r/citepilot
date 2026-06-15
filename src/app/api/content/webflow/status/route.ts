import { NextResponse } from "next/server";
import { getWebflowConnectionStatus } from "@/lib/webflow/client";
import { webflowEnvStatus } from "@/lib/webflow/config";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

export const GET = withApiLogging(async function GET() {
  const env = webflowEnvStatus();
  if (!env.ok) {
    return NextResponse.json({
      configured: false,
      connected: false,
      detail: env.detail,
    });
  }

  const status = await getWebflowConnectionStatus();
  return NextResponse.json(status);
});
