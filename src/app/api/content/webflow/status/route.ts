import { NextResponse } from "next/server";
import { getWebflowConnectionStatus } from "@/lib/webflow/client";
import { webflowEnvStatus } from "@/lib/webflow/config";

export const runtime = "nodejs";

export async function GET() {
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
}
