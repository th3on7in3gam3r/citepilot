import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { updatePlacementStatus } from "@/lib/backlinks/store";
import { getWorkspaceById } from "@/lib/server/workspace";

export const runtime = "nodejs";

type PlacementAction = "accept" | "decline" | "mark_live" | "cancel";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireApiUser(request);
  if (user instanceof NextResponse) return user;
  const userId = apiUserId(user);

  const { id } = await context.params;
  const body = (await request.json()) as {
    workspaceId?: string;
    action?: PlacementAction;
  };

  const workspaceId = body.workspaceId?.trim();
  const action = body.action;

  if (!workspaceId || !action) {
    return NextResponse.json(
      { error: "workspaceId and action are required" },
      { status: 400 },
    );
  }

  const workspace = await getWorkspaceById(workspaceId, userId);
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const result = await updatePlacementStatus({
    placementId: id,
    workspaceId,
    action,
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ placement: result.placement });
}
