import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { buildIntegrationStatuses } from "@/lib/integrations/status";
import { getWorkspaceById } from "@/lib/server/workspace";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";
export const maxDuration = 60;

export const GET = withApiLogging(async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId")?.trim();
  const verify = searchParams.get("verify") === "1";

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
  }

  const user = await requireApiUser(request);
  if (user instanceof NextResponse) return user;
  const userId = apiUserId(user);
  const workspace = await getWorkspaceById(workspaceId, userId);
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const integrations = await buildIntegrationStatuses({
    workspaceId,
    verify,
  });

  const errors = integrations.filter((item) => item.status === "error");

  return NextResponse.json({
    integrations,
    hasErrors: errors.length > 0,
    errorProviders: errors.map((item) => item.id),
  });
});
