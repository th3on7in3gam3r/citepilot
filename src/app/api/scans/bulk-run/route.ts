import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { userHasFleetAccess } from "@/lib/billing/access";
import { listWorkspaceMetaForUser } from "@/lib/server/workspace-management";
import { createBulkScanJob } from "@/lib/scans/queue";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";
export const maxDuration = 300;

export const POST = withApiLogging(async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (auth instanceof NextResponse) return auth;
  const userId = apiUserId(auth);
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  if (!(await userHasFleetAccess(userId))) {
    return NextResponse.json({ error: "Fleet plan required" }, { status: 403 });
  }

  const workspaces = await listWorkspaceMetaForUser(userId);
  const activeIds = workspaces
    .filter((w) => w.status !== "paused" && !w.archivedAt)
    .map((w) => w.id);

  if (activeIds.length === 0) {
    return NextResponse.json(
      { error: "No active workspaces to scan" },
      { status: 400 },
    );
  }

  const result = await createBulkScanJob(userId, activeIds);

  return NextResponse.json({
    ok: true,
    jobId: result.jobId,
    queued: result.queued,
    skipped: result.skipped,
    estimatedMinutes: result.estimatedMinutes,
  });
});
