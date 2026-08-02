import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { getWebflowConnectionStatus } from "@/lib/webflow/client";
import { resolveWebflowConfig } from "@/lib/webflow/resolve-config";
import { getWorkspaceById } from "@/lib/server/workspace";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

export const GET = withApiLogging(async function GET(request: Request) {
  const workspaceId = new URL(request.url).searchParams.get("workspaceId")?.trim();
  let config = null;

  if (workspaceId) {
    const user = await requireApiUser(request);
    if (user instanceof NextResponse) return user;
    const userId = apiUserId(user);
    const workspace = await getWorkspaceById(workspaceId, userId);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }
    config = await resolveWebflowConfig(workspaceId);
  }

  const status = await getWebflowConnectionStatus(config);
  return NextResponse.json(status);
});
