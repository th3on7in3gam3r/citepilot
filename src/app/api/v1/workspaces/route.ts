import { NextResponse } from "next/server";
import { listWorkspacesForUser, toSnapshot } from "@/lib/server/workspace";
import {
  requireFleetAccess,
  withFleetHeaders,
} from "@/lib/fleet/request-auth";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

export const GET = withApiLogging(async function GET(request: Request) {
  try {
    const auth = await requireFleetAccess(request);
    if (auth instanceof NextResponse) return auth;

    const workspaces = await listWorkspacesForUser(auth.userId);
    const items = workspaces.map((ws) => ({
      id: ws.id,
      domain: ws.domain,
      buyerQuestion: ws.buyerQuestion,
      businessType: ws.businessType,
      updatedAt: ws.updatedAt,
      citationScore: toSnapshot(ws).citationScore,
    }));

    return withFleetHeaders(
      NextResponse.json({ workspaces: items }),
      auth,
    );
  } catch (error) {
    console.error("GET /api/v1/workspaces", error);
    return NextResponse.json(
      { error: "Failed to list workspaces", code: "INTERNAL_ERROR", status: 500 },
      { status: 500 },
    );
  }
});
