import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { PILOT_UPGRADE_MESSAGE, userHasPilotAccess } from "@/lib/billing/access";
import { upsertCmsConnection } from "@/lib/cms/store";
import { getWorkspaceById } from "@/lib/server/workspace";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

export const POST = withApiLogging(async function POST(request: Request) {
  const user = await requireApiUser(request);
  if (user instanceof NextResponse) return user;
  const userId = apiUserId(user);
  if (!(await userHasPilotAccess(userId))) {
    return NextResponse.json({ error: PILOT_UPGRADE_MESSAGE }, { status: 402 });
  }

  const body = (await request.json()) as { workspaceId?: string };
  const workspaceId = body.workspaceId?.trim();
  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
  }

  const workspace = await getWorkspaceById(workspaceId, userId);
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  await upsertCmsConnection({
    workspaceId,
    provider: "framer",
    displayName: "Framer GEO snippet",
    siteUrl: workspace.domain ? `https://${workspace.domain}` : "",
    credentials: {
      projectUrl: "",
      apiKey: "",
      collectionId: "",
      titleFieldId: "",
      bodyFieldId: "",
    },
    remoteDefaults: {
      collectionName: "Snippet",
      snippetInstalled: true,
    },
  });

  return NextResponse.json({ ok: true, connected: true });
});
