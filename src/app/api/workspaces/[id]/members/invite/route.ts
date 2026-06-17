import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { getSessionUser } from "@/lib/auth/server";
import { inviteWorkspaceMember } from "@/lib/server/workspace-members";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export const POST = withApiLogging(async function POST(request: Request, { params }: Params) {
  const auth = await requireApiUser(request);
  if (auth instanceof NextResponse) return auth;
  const userId = apiUserId(auth);
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as { email?: string; role?: string };
  const email = body.email?.trim();
  const role = body.role === "editor" ? "editor" : "viewer";

  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 422 });
  }

  const session = await getSessionUser(request);
  const result = await inviteWorkspaceMember({
    workspaceId: id,
    ownerUserId: userId,
    email,
    role,
    inviterName: session?.name || session?.email || "A teammate",
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, code: result.code },
      { status: result.code === "MEMBER_LIMIT" ? 403 : 422 },
    );
  }

  return NextResponse.json({ data: { id: result.id } });
});
