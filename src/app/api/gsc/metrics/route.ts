import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { fetchGscMetrics } from "@/lib/gsc/client";
import { deleteGscConnection } from "@/lib/gsc/store";
import { isGscConfigured } from "@/lib/gsc/config";
import { getWorkspaceById } from "@/lib/server/workspace";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId")?.trim();
  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  }

  const user = await requireApiUser(request);
  if (user instanceof NextResponse) return user;
  const userId = apiUserId(user);

  const ws = await getWorkspaceById(workspaceId, userId);
  if (!ws) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const metrics = await fetchGscMetrics(workspaceId);
  return NextResponse.json({
    configured: isGscConfigured(),
    metrics,
  });
}

export async function DELETE(request: Request) {
  const user = await requireApiUser(request);
  if (user instanceof NextResponse) return user;
  const userId = apiUserId(user);

  const body = (await request.json()) as { workspaceId?: string };
  const workspaceId = body.workspaceId?.trim();
  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  }

  const ws = await getWorkspaceById(workspaceId, userId);
  if (!ws) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  await deleteGscConnection(workspaceId);
  return NextResponse.json({ ok: true });
}
