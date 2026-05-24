import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { getBacklinkDashboard } from "@/lib/backlinks/store";
import { getWorkspaceById } from "@/lib/server/workspace";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId")?.trim();
  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  }

  const user = await requireApiUser(request);
  if (user instanceof NextResponse) return user;
  const userId = apiUserId(user);

  const workspace = await getWorkspaceById(workspaceId, userId);
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const autoRefresh = searchParams.get("refresh") !== "0";
  const dashboard = await getBacklinkDashboard({
    workspaceId,
    userId,
    domain: workspace.domain,
    businessType: workspace.businessType,
    competitors: workspace.competitors,
    autoRefresh,
  });

  return NextResponse.json(dashboard);
}
