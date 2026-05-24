import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { WORKSPACE_COOKIE } from "@/lib/constants";
import {
  deleteWorkspace,
  enrichSnapshotWithBacklinks,
  getWorkspaceById,
  toSnapshot,
} from "@/lib/server/workspace";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
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
      raw: workspace,
    });
  } catch (error) {
    console.error("GET /api/workspaces/[id]", error);
    return NextResponse.json(
      { error: "Failed to load workspace" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await requireApiUser(request);
    if (user instanceof NextResponse) return user;
    const userId = apiUserId(user);

    const { id } = await params;
    const body = await request.json();
    const { updateWorkspace } = await import("@/lib/server/workspace");
    const workspace = await updateWorkspace(id, body, userId);
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
}

export async function DELETE(request: Request, { params }: Params) {
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
}
