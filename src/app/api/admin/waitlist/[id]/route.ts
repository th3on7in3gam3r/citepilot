import { NextResponse } from "next/server";
import { deleteWaitlistEntry } from "@/lib/server/workspace";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export const DELETE = withApiLogging(async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const ok = await deleteWaitlistEntry(id);
    if (!ok) {
      return NextResponse.json({ error: "Waitlist entry not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/admin/waitlist/[id]", error);
    return NextResponse.json({ error: "Failed to delete waitlist entry" }, { status: 500 });
  }
});
