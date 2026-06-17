import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { getSessionUser } from "@/lib/auth/server";
import { acceptWorkspaceInvite } from "@/lib/server/workspace-members";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

type Params = { params: Promise<{ token: string }> };

export const PATCH = withApiLogging(async function PATCH(request: Request, { params }: Params) {
  const auth = await requireApiUser(request);
  if (auth instanceof NextResponse) return auth;
  const userId = apiUserId(auth);
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const session = await getSessionUser(request);
  if (!session?.email) {
    return NextResponse.json({ error: "Account email required" }, { status: 422 });
  }

  const { token } = await params;
  const result = await acceptWorkspaceInvite({
    token,
    userId,
    userEmail: session.email,
  });

  if (!result.ok) {
    const status =
      result.code === "EXPIRED" ? 410 : result.code === "EMAIL_MISMATCH" ? 403 : 422;
    return NextResponse.json({ error: result.error, code: result.code }, { status });
  }

  return NextResponse.json({ data: { workspaceId: result.workspaceId } });
});
