import { NextResponse } from "next/server";
import { getInviteByToken } from "@/lib/server/workspace-members";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

type Params = { params: Promise<{ token: string }> };

export const GET = withApiLogging(async function GET(_request: Request, { params }: Params) {
  const { token } = await params;
  const invite = await getInviteByToken(token);
  if (!invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      workspaceDomain: invite.workspaceDomain,
      role: invite.role,
      email: invite.email,
      expired: invite.expired,
    },
  });
});
