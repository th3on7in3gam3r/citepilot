import { NextResponse } from "next/server";
import { isVerifiedReportHost } from "@/lib/white-label/domains";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

export const GET = withApiLogging(async function GET(request: Request) {
  const host = new URL(request.url).searchParams.get("host")?.trim();
  if (!host) {
    return NextResponse.json({ verified: false }, { status: 400 });
  }

  const verified = await isVerifiedReportHost(host);
  return NextResponse.json({ verified });
});
