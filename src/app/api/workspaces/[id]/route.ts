import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { WORKSPACE_COOKIE } from "@/lib/constants";
import { updateWorkspaceManagement } from "@/lib/server/workspace-management";
import {
  deleteWorkspace,
  enrichSnapshotWithBacklinks,
  getWorkspaceById,
  toSnapshot,
  updateWorkspace,
} from "@/lib/server/workspace";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export const GET = withApiLogging(async function GET(request: Request, { params }: Params) {
  try {
    const user = await requireApiUser(request);
    if (user instanceof NextResponse) return user;
    const userId = apiUserId(user);

    const { id } = await params;
    const workspace = await getWorkspaceById(id, userId);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const snapshot = await enrichSnapshotWithBacklinks(
      toSnapshot(workspace),
      workspace.id,
    );

    return NextResponse.json({
      id: workspace.id,
      workspace: snapshot,
    });
  } catch (error) {
    console.error("GET /api/workspaces/[id]", error);
    return NextResponse.json(
      { error: "Failed to load workspace" },
      { status: 500 },
    );
  }
});

export const PATCH = withApiLogging(async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await requireApiUser(request);
    if (user instanceof NextResponse) return user;
    const userId = apiUserId(user);

    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;

    if (
      body.displayName !== undefined ||
      body.status !== undefined ||
      body.archived !== undefined ||
      body.restore !== undefined
    ) {
      await updateWorkspaceManagement(id, userId!, {
        displayName:
          typeof body.displayName === "string" ? body.displayName : undefined,
        status:
          body.status === "active" || body.status === "paused"
            ? body.status
            : undefined,
        archived: body.archived === true,
        restore: body.restore === true,
      });
    }

    const workspace = await updateWorkspace(
      id,
      body as Parameters<typeof updateWorkspace>[1],
      userId,
    );
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }
    const snapshot = await enrichSnapshotWithBacklinks(
      toSnapshot(workspace),
      workspace.id,
    );
    return NextResponse.json({
      id: workspace.id,
      workspace: snapshot,
    });
  } catch (error) {
    console.error("PATCH /api/workspaces/[id]", error);
    return NextResponse.json(
      { error: "Failed to update workspace" },
      { status: 500 },
    );
  }
});

export const DELETE = withApiLogging(async function DELETE(request: Request, { params }: Params) {
  try {
    const user = await requireApiUser(request);
    if (user instanceof NextResponse) return user;
    const userId = apiUserId(user);

    const { id } = await params;
    const ok = await deleteWorkspace(id, userId);
    if (!ok) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }
    const response = NextResponse.json({ ok: true });
    response.cookies.set(WORKSPACE_COOKIE, "", { path: "/", maxAge: 0 });
    return response;
  } catch (error) {
    console.error("DELETE /api/workspaces/[id]", error);
    return NextResponse.json(
      { error: "Failed to delete workspace" },
      { status: 500 },
    );
  }
});
