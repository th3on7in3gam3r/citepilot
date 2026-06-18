import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { requireWorkspaceAccess } from "@/lib/auth/workspace-access";
import { getScanHistory } from "@/lib/scans/history";
import { formatScanTrigger } from "@/lib/scans/history-format";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

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
  const access = await requireWorkspaceAccess(userId, workspaceId);
  if (!access) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const limit = Math.min(
    100,
    Math.max(1, Number(new URL(request.url).searchParams.get("limit") ?? 50)),
  );

  const history = await getScanHistory(workspaceId, limit);

  return NextResponse.json({
    ok: true,
    history: history.map((entry) => ({
      ...entry,
      triggerLabel: formatScanTrigger(entry.trigger),
    })),
  });
});
