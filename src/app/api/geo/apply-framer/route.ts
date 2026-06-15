import { NextResponse } from "next/server";
import { applyGeoSnippetToFramer } from "@/lib/cms/framer-geo-snippet";
import { getCmsConnection } from "@/lib/cms/store";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { PILOT_UPGRADE_MESSAGE, userHasPilotAccess } from "@/lib/billing/access";
import { getWorkspaceById } from "@/lib/server/workspace";
import type { FramerCredentials } from "@/lib/cms/types";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";
export const maxDuration = 60;

export const POST = withApiLogging(async function POST(request: Request) {
  try {
    const user = await requireApiUser(request);
    if (user instanceof NextResponse) return user;
    const userId = apiUserId(user);

    if (!(await userHasPilotAccess(userId))) {
      return NextResponse.json(
        { error: PILOT_UPGRADE_MESSAGE, upgradeUrl: "/pricing" },
        { status: 402 },
      );
    }

    const body = (await request.json()) as {
      workspaceId?: string;
      publish?: boolean;
    };
    const workspaceId = body.workspaceId?.trim();
    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
    }

    const workspace = await getWorkspaceById(workspaceId, userId);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const connection = await getCmsConnection(workspaceId, "framer");
    if (!connection) {
      return NextResponse.json(
        { error: "Connect Framer under Content → CMS Settings first" },
        { status: 404 },
      );
    }

    const result = await applyGeoSnippetToFramer({
      credentials: connection.credentials as FramerCredentials,
      workspaceId,
      publish: body.publish === true,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not apply GEO snippet to Framer";
    return NextResponse.json({ error: message }, { status: 400 });
  }
});
