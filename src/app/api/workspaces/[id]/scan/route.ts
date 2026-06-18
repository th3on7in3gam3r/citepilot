import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { requireWorkspaceAccess } from "@/lib/auth/workspace-access";
import {
  PILOT_UPGRADE_MESSAGE,
  userHasPilotAccess,
} from "@/lib/billing/access";
import { assertManualScanAllowed, getManualScanQuota } from "@/lib/scans/rate-limits";
import { queueWorkspaceScan, workspaceScanInProgress } from "@/lib/scans/queue";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export const POST = withApiLogging(async function POST(
  request: Request,
  context: RouteContext,
) {
  const auth = await requireApiUser(request);
  if (auth instanceof NextResponse) return auth;
  const userId = apiUserId(auth);
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  if (!(await userHasPilotAccess(userId))) {
    return NextResponse.json({ error: PILOT_UPGRADE_MESSAGE }, { status: 403 });
  }

  const { id: workspaceId } = await context.params;
  const access = await requireWorkspaceAccess(userId, workspaceId, "editor");
  if (!access) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  if (await workspaceScanInProgress(workspaceId)) {
    return NextResponse.json(
      { error: "Scan already in progress", inProgress: true },
      { status: 409 },
    );
  }

  const allowed = await assertManualScanAllowed(workspaceId, userId);
  if (!allowed.ok) {
    return NextResponse.json(
      { error: allowed.message, quota: allowed.quota },
      { status: 429 },
    );
  }

  const queued = await queueWorkspaceScan({
    workspaceId,
    userId,
    trigger: "manual",
  });

  if (!queued.ok) {
    if (queued.reason === "paused") {
      return NextResponse.json(
        { error: "Monitoring is paused for this workspace" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Scan already in progress", inProgress: true },
      { status: 409 },
    );
  }

  const updatedQuota = await getManualScanQuota(workspaceId, userId);

  return NextResponse.json({
    ok: true,
    queued: true,
    jobItemId: queued.jobItemId,
    quota: updatedQuota,
    remainingLabel:
      updatedQuota.remaining === 1
        ? "1 manual scan remaining today"
        : `${updatedQuota.remaining} manual scans remaining today`,
  });
});

export const GET = withApiLogging(async function GET(
  request: Request,
  context: RouteContext,
) {
  const auth = await requireApiUser(request);
  if (auth instanceof NextResponse) return auth;
  const userId = apiUserId(auth);
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id: workspaceId } = await context.params;
  const access = await requireWorkspaceAccess(userId, workspaceId, "editor");
  if (!access) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const quota = await getManualScanQuota(workspaceId, userId);
  const inProgress = await workspaceScanInProgress(workspaceId);

  return NextResponse.json({
    ok: true,
    inProgress,
    quota,
    remainingLabel:
      quota.remaining === 1
        ? "1 manual scan remaining today"
        : `${quota.remaining} manual scans remaining today`,
  });
});
