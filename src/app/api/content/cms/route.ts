import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { getWorkspaceById } from "@/lib/server/workspace";
import { buildIntegrationStatuses, integrationSummariesFromStatuses } from "@/lib/integrations/status";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

export const GET = withApiLogging(async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId")?.trim();
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
  });
  const providers = integrationSummariesFromStatuses(integrations);

  return NextResponse.json({ providers, integrations });
});
