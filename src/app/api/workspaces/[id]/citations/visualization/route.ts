import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { getPlatformChecksForAudit } from "@/lib/audit/platform-checks-store";
import { getLatestAuditForWorkspace } from "@/lib/audit/run-audit";
import {
  buildCitationHeatmapData,
  buildCompetitorSovData,
} from "@/lib/citations/viz-data";
import { getWorkspaceById, toSnapshotAsync } from "@/lib/server/workspace";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export const GET = withApiLogging(async function GET(request: Request, { params }: Params) {
  const user = await requireApiUser(request);
  if (user instanceof NextResponse) return user;
  const userId = apiUserId(user);
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id } = await params;
  const workspace = await getWorkspaceById(id, userId);
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const snapshot = await toSnapshotAsync(workspace);
  const audit = workspace.latestAudit ?? (await getLatestAuditForWorkspace(id));
  const checks = audit ? await getPlatformChecksForAudit(audit.id) : [];

  return NextResponse.json({
    heatmap: buildCitationHeatmapData({ workspace: snapshot, checks }),
    sov: buildCompetitorSovData(snapshot),
  });
});
