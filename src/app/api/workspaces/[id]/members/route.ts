import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import {
  inviteWorkspaceMember,
  listWorkspaceMembers,
} from "@/lib/server/workspace-management";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export const GET = withApiLogging(async function GET(request: Request, { params }: Params) {
  const auth = await requireApiUser(request);
  if (auth instanceof NextResponse) return auth;
  const userId = apiUserId(auth);
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id } = await params;
  const members = await listWorkspaceMembers(id, userId);
  return NextResponse.json({
    members: members.map((m) => ({
      id: m.id,
      email: m.email,
      role: m.role,
      invitedAt: m.invited_at,
      acceptedAt: m.accepted_at,
    })),
  });
});

export const POST = withApiLogging(async function POST(request: Request, { params }: Params) {
  const auth = await requireApiUser(request);
  if (auth instanceof NextResponse) return auth;
  const userId = apiUserId(auth);
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as { email?: string };
  const email = body.email?.trim();
  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const result = await inviteWorkspaceMember({
    workspaceId: id,
    ownerUserId: userId,
    email,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }

  return NextResponse.json({ ok: true, id: result.id });
});
