import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { buildGscAuthUrl } from "@/lib/gsc/client";
import { isGscConfigured } from "@/lib/gsc/config";
import { getWorkspaceById } from "@/lib/server/workspace";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

export const GET = withApiLogging(async function GET(request: Request) {
  if (!isGscConfigured()) {
    return NextResponse.json(
      { error: "Google Search Console not configured on server" },
      { status: 503 },
    );
  }

  const user = await requireApiUser(request);
  if (user instanceof NextResponse) return user;
  const userId = apiUserId(user);
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId")?.trim();
  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  }

  const ws = await getWorkspaceById(workspaceId, userId);
  if (!ws) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const state = Buffer.from(
    JSON.stringify({ workspaceId, userId }),
  ).toString("base64url");

  return NextResponse.json({ url: buildGscAuthUrl(state) });
});
