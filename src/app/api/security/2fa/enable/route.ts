import { NextResponse } from "next/server";
import { getRealSessionUser } from "@/lib/auth/server";
import { withApiLogging } from "@/lib/observability/api-log";
import { verifyAndEnableTotp } from "@/lib/security/totp-store";

export const runtime = "nodejs";

export const POST = withApiLogging(async function POST(request: Request) {
  const session = await getRealSessionUser(request);
  if (!session?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { token?: string } | null;
  const token = body?.token?.trim();
  if (!token) {
    return NextResponse.json({ error: "Enter the 6-digit code" }, { status: 400 });
  }

  const result = await verifyAndEnableTotp(session.id, token);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ backupCodes: result.backupCodes });
});
