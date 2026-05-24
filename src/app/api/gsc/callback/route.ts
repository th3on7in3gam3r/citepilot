import { NextResponse } from "next/server";
import { connectGscForWorkspace, exchangeGscCode } from "@/lib/gsc/client";
import { appBaseUrl } from "@/lib/stripe/config";
import { getWorkspaceById } from "@/lib/server/workspace";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const stateRaw = searchParams.get("state");
  const error = searchParams.get("error");

  const redirectBase = `${appBaseUrl()}/dashboard/analytics`;

  if (error || !code || !stateRaw) {
    return NextResponse.redirect(`${redirectBase}?gsc=error`);
  }

  try {
    const state = JSON.parse(
      Buffer.from(stateRaw, "base64url").toString("utf8"),
    ) as { workspaceId?: string; userId?: string };

    if (!state.workspaceId || !state.userId) {
      return NextResponse.redirect(`${redirectBase}?gsc=error`);
    }

    const ws = await getWorkspaceById(state.workspaceId, state.userId);
    if (!ws) {
      return NextResponse.redirect(`${redirectBase}?gsc=error`);
    }

    const tokens = await exchangeGscCode(code);
    const siteUrl = await connectGscForWorkspace({
      workspaceId: state.workspaceId,
      userId: state.userId,
      domain: ws.domain,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
    });

    if (!siteUrl) {
      return NextResponse.redirect(`${redirectBase}?gsc=no_site`);
    }

    return NextResponse.redirect(`${redirectBase}?gsc=connected`);
  } catch (err) {
    console.error("GSC callback", err);
    return NextResponse.redirect(`${redirectBase}?gsc=error`);
  }
}
