import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { setNetworkOptIn } from "@/lib/backlinks/store";
import { getWorkspaceById } from "@/lib/server/workspace";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

export const POST = withApiLogging(async function POST(request: Request) {
  const user = await requireApiUser(request);
  if (user instanceof NextResponse) return user;
  const userId = apiUserId(user);

  const body = (await request.json()) as {
    workspaceId?: string;
    optedIn?: boolean;
  };
  const workspaceId = body.workspaceId?.trim();
  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  }

  const workspace = await getWorkspaceById(workspaceId, userId);
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const network = await setNetworkOptIn({
    workspaceId,
    userId,
    domain: workspace.domain,
    businessType: workspace.businessType,
    optedIn: Boolean(body.optedIn),
  });

  return NextResponse.json({ network });
});
