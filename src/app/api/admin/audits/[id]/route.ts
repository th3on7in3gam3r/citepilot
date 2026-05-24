import { NextResponse } from "next/server";
import { deleteAuditRun } from "@/lib/server/workspace";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const ok = await deleteAuditRun(id);
    if (!ok) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/admin/audits/[id]", error);
    return NextResponse.json({ error: "Failed to delete audit" }, { status: 500 });
  }
}
