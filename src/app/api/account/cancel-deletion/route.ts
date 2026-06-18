import { NextResponse } from "next/server";
import { cancelAccountDeletion } from "@/lib/account/deletion";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

export const POST = withApiLogging(async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { token?: string } | null;
  const token = body?.token?.trim();
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const result = await cancelAccountDeletion(token);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
});
