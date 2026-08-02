import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { userHasFleetAccess } from "@/lib/billing/access";
import { getBulkScanStatus } from "@/lib/scans/queue";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

export const GET = withApiLogging(async function GET(request: Request) {
  const auth = await requireApiUser(request);
  if (auth instanceof NextResponse) return auth;
  const userId = apiUserId(auth);
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  if (!(await userHasFleetAccess(userId))) {
    return NextResponse.json({ error: "Fleet plan required" }, { status: 403 });
  }

  const jobId = new URL(request.url).searchParams.get("jobId");
  const status = await getBulkScanStatus(userId, jobId);

  return NextResponse.json({
    ok: true,
    ...status,
    progressLabel:
      status.status === "idle"
        ? null
        : `Scanning ${status.total} workspaces… ${status.completed + status.failed + status.skipped} of ${status.total} complete`,
  });
});
