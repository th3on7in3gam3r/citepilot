import { NextResponse } from "next/server";
import { getSharedAudit } from "@/lib/audit/share";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

type Params = { params: Promise<{ token: string }> };

export const GET = withApiLogging(async function GET(_request: Request, { params }: Params) {
  const { token } = await params;
  const shared = await getSharedAudit(token);
  if (!shared) {
    return NextResponse.json({ error: "Share link not found" }, { status: 404 });
  }
  return NextResponse.json(shared);
});
