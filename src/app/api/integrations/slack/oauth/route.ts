import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import {
  buildSlackOAuthUrl,
  isSlackConfigured,
} from "@/lib/alerts/slack-config";
import { userHasPilotAccess } from "@/lib/billing/access";
import { getWorkspaceById } from "@/lib/server/workspace";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

export const GET = withApiLogging(async function GET(request: Request) {
  if (!isSlackConfigured()) {
    return NextResponse.json(
      { error: "Slack integration not configured on server" },
      { status: 503 },
    );
  }

  const user = await requireApiUser(request);
  if (user instanceof NextResponse) return user;
  const userId = apiUserId(user);
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  if (!(await userHasPilotAccess(userId))) {
    return NextResponse.json(
      { error: "Pilot or Fleet subscription required" },
      { status: 403 },
    );
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

  const state = Buffer.from(
    JSON.stringify({ workspaceId, userId }),
  ).toString("base64url");

  return NextResponse.json({ url: buildSlackOAuthUrl(state) });
});
