import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { getEffectivePlanForUser } from "@/lib/billing/limits-server";
import { requireWorkspaceAccess } from "@/lib/auth/workspace-access";
import { getBrowserScanUsageSummary } from "@/lib/scanners/browser-scan-usage";
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

  const plan = await getEffectivePlanForUser(userId);
  const summary = await getBrowserScanUsageSummary(workspaceId, plan);

  return NextResponse.json({
    ok: true,
    ...summary,
  });
});
