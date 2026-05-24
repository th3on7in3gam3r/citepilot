import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { userHasPilotAccess, PILOT_UPGRADE_MESSAGE } from "@/lib/billing/access";
import { createPlacementRequest } from "@/lib/backlinks/store";
import { getWorkspaceById } from "@/lib/server/workspace";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await requireApiUser(request);
  if (user instanceof NextResponse) return user;
  const userId = apiUserId(user);

  if (!(await userHasPilotAccess(userId))) {
    return NextResponse.json({ error: PILOT_UPGRADE_MESSAGE }, { status: 402 });
  }

  const body = (await request.json()) as {
    workspaceId?: string;
    targetUrl?: string;
    anchorText?: string;
    contextNote?: string;
    preferredPartnerId?: string;
  };

  const workspaceId = body.workspaceId?.trim();
  const targetUrl = body.targetUrl?.trim();
  const anchorText = body.anchorText?.trim();

  if (!workspaceId || !targetUrl || !anchorText) {
    return NextResponse.json(
      { error: "workspaceId, targetUrl, and anchorText are required" },
      { status: 400 },
    );
  }

  const workspace = await getWorkspaceById(workspaceId, userId);
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const result = await createPlacementRequest({
    workspaceId,
    userId,
    domain: workspace.domain,
    businessType: workspace.businessType,
    competitors: workspace.competitors,
    targetUrl,
    anchorText,
    contextNote: body.contextNote,
    preferredPartnerId: body.preferredPartnerId,
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ placement: result.placement });
}
