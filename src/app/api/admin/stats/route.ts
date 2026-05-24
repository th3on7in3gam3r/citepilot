import { NextResponse } from "next/server";
import {
  getAdminStats,
  listRecentAudits,
  listRecentWorkspaces,
  listWaitlist,
} from "@/lib/server/workspace";

export const runtime = "nodejs";

export async function GET() {
  try {
    const stats = await getAdminStats();
    const workspaces = await listRecentWorkspaces(10);
    const audits = await listRecentAudits(10);
    const waitlist = await listWaitlist(20);

    return NextResponse.json({
      stats,
      workspaces: workspaces.map((w) => ({
        id: w.id,
        domain: w.domain,
        buyerQuestion: w.buyerQuestion,
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
        citationScore: w.latestAudit?.score ?? null,
      })),
      audits,
      waitlist,
    });
  } catch (error) {
    console.error("GET /api/admin/stats", error);
    return NextResponse.json({ error: "Failed to load admin stats" }, { status: 500 });
  }
}
