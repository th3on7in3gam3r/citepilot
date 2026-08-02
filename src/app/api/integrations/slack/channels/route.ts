import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { isSlackConfigured } from "@/lib/alerts/slack-config";
import { listSlackChannels } from "@/lib/alerts/slack-client";
import { getSlackConnection } from "@/lib/alerts/store";
import { userHasPilotAccess } from "@/lib/billing/access";
import { getWorkspaceById } from "@/lib/server/workspace";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

export const GET = withApiLogging(async function GET(request: Request) {
  const user = await requireApiUser(request);
  if (user instanceof NextResponse) return user;
  const userId = apiUserId(user);
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  if (!(await userHasPilotAccess(userId))) {
    return NextResponse.json({ error: "Pilot or Fleet required" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId")?.trim();
  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  }

  const ws = await getWorkspaceById(workspaceId, userId);
  if (!ws) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const configured = isSlackConfigured();
  const connection = await getSlackConnection(workspaceId, userId);
  if (!connection) {
    return NextResponse.json({ connected: false, configured, channels: [] });
  }

  try {
    const channels = await listSlackChannels(connection);
    return NextResponse.json({
      connected: true,
      configured: true,
      teamName: connection.slack_team_name,
      channelId: connection.slack_channel_id,
      channelName: connection.slack_channel_name,
      channels,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list channels";
    return NextResponse.json({ error: message }, { status: 502 });
  }
});
