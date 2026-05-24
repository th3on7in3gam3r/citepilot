import { NextResponse } from "next/server";
import { dedupeAllWorkspaces } from "@/lib/server/dedupe-workspaces";

export const runtime = "nodejs";

export async function POST() {
  try {
    const report = await dedupeAllWorkspaces();
    return NextResponse.json({ ok: true, report });
  } catch (error) {
    console.error("POST /api/admin/workspaces/dedupe", error);
    return NextResponse.json({ error: "Dedupe failed" }, { status: 500 });
  }
}
