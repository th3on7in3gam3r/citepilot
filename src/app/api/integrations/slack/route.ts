import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import {
  deleteSlackConnection,
  getSlackConnection,
  updateSlackChannel,
} from "@/lib/alerts/store";
import { userHasPilotAccess } from "@/lib/billing/access";
import { getWorkspaceById } from "@/lib/server/workspace";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

async function authorize(request: Request) {
  const user = await requireApiUser(request);
  if (user instanceof NextResponse) return user;
  const userId = apiUserId(user);
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  if (!(await userHasPilotAccess(userId))) {
    return NextResponse.json({ error: "Pilot or Fleet required" }, { status: 403 });
  }
  return { userId };
}

export const GET = withApiLogging(async function GET(request: Request) {
  const auth = await authorize(request);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId")?.trim();
  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  }

  const ws = await getWorkspaceById(workspaceId, auth.userId);
  if (!ws) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const connection = await getSlackConnection(workspaceId, auth.userId);
  if (!connection) {
    return NextResponse.json({ connected: false });
  }

  return NextResponse.json({
    connected: true,
    teamName: connection.slack_team_name,
    channelId: connection.slack_channel_id,
    channelName: connection.slack_channel_name,
  });
});

export const PATCH = withApiLogging(async function PATCH(request: Request) {
  const auth = await authorize(request);
  if (auth instanceof NextResponse) return auth;

  const body = (await request.json()) as {
    workspaceId?: string;
    channelId?: string;
    channelName?: string;
  };
  const workspaceId = body.workspaceId?.trim();
  const channelId = body.channelId?.trim();
  const channelName = body.channelName?.trim();

  if (!workspaceId || !channelId || !channelName) {
    return NextResponse.json(
      { error: "workspaceId, channelId, and channelName required" },
      { status: 400 },
    );
  }

  const ws = await getWorkspaceById(workspaceId, auth.userId);
  if (!ws) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const connection = await getSlackConnection(workspaceId, auth.userId);
  if (!connection) {
    return NextResponse.json({ error: "Slack not connected" }, { status: 404 });
  }

  await updateSlackChannel({
    workspaceId,
    userId: auth.userId,
    channelId,
    channelName,
  });

  return NextResponse.json({ ok: true });
});

export const DELETE = withApiLogging(async function DELETE(request: Request) {
  const auth = await authorize(request);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId")?.trim();
  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  }

  await deleteSlackConnection(workspaceId, auth.userId);
  return NextResponse.json({ ok: true });
});
