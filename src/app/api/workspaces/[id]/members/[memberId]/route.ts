import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { getSessionUser } from "@/lib/auth/server";
import {
  resendWorkspaceInvite,
  revokeWorkspaceMember,
  updateWorkspaceMemberRole,
} from "@/lib/server/workspace-members";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string; memberId: string }> };

export const PATCH = withApiLogging(async function PATCH(request: Request, { params }: Params) {
  const auth = await requireApiUser(request);
  if (auth instanceof NextResponse) return auth;
  const userId = apiUserId(auth);
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id, memberId } = await params;
  const body = (await request.json()) as { role?: string; resend?: boolean };

  if (body.resend === true) {
    const session = await getSessionUser(request);
    const result = await resendWorkspaceInvite({
      workspaceId: id,
      ownerUserId: userId,
      memberId,
      inviterName: session?.name || session?.email || "A teammate",
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }
    return NextResponse.json({ data: { ok: true } });
  }

  const role = body.role === "editor" ? "editor" : "viewer";
  const result = await updateWorkspaceMemberRole({
    workspaceId: id,
    ownerUserId: userId,
    memberId,
    role,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }
  return NextResponse.json({ data: { ok: true } });
});

export const DELETE = withApiLogging(async function DELETE(request: Request, { params }: Params) {
  const auth = await requireApiUser(request);
  if (auth instanceof NextResponse) return auth;
  const userId = apiUserId(auth);
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id, memberId } = await params;
  const result = await revokeWorkspaceMember({
    workspaceId: id,
    ownerUserId: userId,
    memberId,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }
  return NextResponse.json({ data: { ok: true } });
});
