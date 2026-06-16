import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { transferWorkspace } from "@/lib/server/workspace-management";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export const POST = withApiLogging(async function POST(request: Request, { params }: Params) {
  const auth = await requireApiUser(request);
  if (auth instanceof NextResponse) return auth;
  const userId = apiUserId(auth);
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as { toEmail?: string };
  const toEmail = body.toEmail?.trim();
  if (!toEmail) {
    return NextResponse.json({ error: "toEmail is required" }, { status: 400 });
  }

  const result = await transferWorkspace(id, userId, toEmail);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }

  return NextResponse.json({ ok: true });
});
