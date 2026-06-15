import { NextResponse } from "next/server";
import { exchangeSlackCode } from "@/lib/alerts/slack-client";
import { slackRedirectUri } from "@/lib/alerts/slack-config";
import { upsertSlackConnection } from "@/lib/alerts/store";
import { appBaseUrl } from "@/lib/stripe/config";
import { getWorkspaceById } from "@/lib/server/workspace";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

export const GET = withApiLogging(async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const stateRaw = searchParams.get("state");
  const error = searchParams.get("error");

  const redirectBase = `${appBaseUrl()}/dashboard/settings?alerts=slack`;

  if (error || !code || !stateRaw) {
    return NextResponse.redirect(`${redirectBase}&slack=error`);
  }

  try {
    const state = JSON.parse(
      Buffer.from(stateRaw, "base64url").toString("utf8"),
    ) as { workspaceId?: string; userId?: string };

    if (!state.workspaceId || !state.userId) {
      return NextResponse.redirect(`${redirectBase}&slack=error`);
    }

    const ws = await getWorkspaceById(state.workspaceId, state.userId);
    if (!ws) {
      return NextResponse.redirect(`${redirectBase}&slack=error`);
    }

    const tokenResponse = await exchangeSlackCode(code, slackRedirectUri());
    if (!tokenResponse.ok || !tokenResponse.access_token || !tokenResponse.team) {
      console.error("[slack] oauth exchange failed", tokenResponse.error);
      return NextResponse.redirect(`${redirectBase}&slack=error`);
    }

    await upsertSlackConnection({
      userId: state.userId,
      workspaceId: state.workspaceId,
      slackTeamId: tokenResponse.team.id,
      slackTeamName: tokenResponse.team.name,
      botToken: tokenResponse.access_token,
    });

    return NextResponse.redirect(`${redirectBase}&slack=connected`);
  } catch (err) {
    console.error("[slack] callback", err);
    return NextResponse.redirect(`${redirectBase}&slack=error`);
  }
});
