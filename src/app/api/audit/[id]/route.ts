import { NextResponse } from "next/server";
import { getAuditById } from "@/lib/audit/run-audit";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export const GET = withApiLogging(async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const audit = await getAuditById(id);
    if (!audit) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }
    return NextResponse.json(audit);
  } catch (error) {
    console.error("GET /api/audit/[id]", error);
    return NextResponse.json({ error: "Failed to load audit" }, { status: 500 });
  }
});
