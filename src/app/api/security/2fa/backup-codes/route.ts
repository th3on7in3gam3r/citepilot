import { NextResponse } from "next/server";
import { getRealSessionUser } from "@/lib/auth/server";
import { withApiLogging } from "@/lib/observability/api-log";
import {
  getMaskedBackupCodes,
  regenerateBackupCodes,
} from "@/lib/security/totp-store";

export const runtime = "nodejs";

export const GET = withApiLogging(async function GET(request: Request) {
  const session = await getRealSessionUser(request);
  if (!session?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const codes = await getMaskedBackupCodes(session.id);
  return NextResponse.json({ codes, count: codes.length });
});

export const POST = withApiLogging(async function POST(request: Request) {
  const session = await getRealSessionUser(request);
  if (!session?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { token?: string } | null;
  const token = body?.token?.trim();
  if (!token) {
    return NextResponse.json({ error: "Enter your authenticator code" }, { status: 400 });
  }

  const result = await regenerateBackupCodes(session.id, token);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ backupCodes: result.backupCodes });
});
