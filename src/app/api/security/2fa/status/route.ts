import { NextResponse } from "next/server";
import { getRealSessionUser } from "@/lib/auth/server";
import { withApiLogging } from "@/lib/observability/api-log";
import { getTotpPublicStatus } from "@/lib/security/totp-store";

export const runtime = "nodejs";

export const GET = withApiLogging(async function GET(request: Request) {
  const session = await getRealSessionUser(request);
  if (!session?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const status = await getTotpPublicStatus(session.id);
  return NextResponse.json(status);
});
