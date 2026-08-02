import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { fetchGscMetrics } from "@/lib/gsc/client";
import { deleteGscConnection } from "@/lib/gsc/store";
import { isGscConfigured } from "@/lib/gsc/config";
import { getWorkspaceById } from "@/lib/server/workspace";
import { captureServerException } from "@/lib/observability/sentry";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

export const GET = withApiLogging(async function GET(request: Request) {
  try {
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
  } catch (error) {
    captureServerException(error, { route: "GET /api/gsc/metrics" });
    console.error("GET /api/gsc/metrics", error);
    const message =
      error instanceof Error ? error.message : "GSC metrics unavailable";
    return NextResponse.json(
      {
        configured: isGscConfigured(),
        metrics: {
          connected: false,
          siteUrl: null,
          clicks: 0,
          impressions: 0,
          ctr: 0,
          position: 0,
          clicksDelta: null,
          impressionsDelta: null,
          daily: [],
        },
        error:
          process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status: 200 },
    );
  }
});

export const DELETE = withApiLogging(async function DELETE(request: Request) {
  try {
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
  } catch (error) {
    captureServerException(error, { route: "DELETE /api/gsc/metrics" });
    console.error("DELETE /api/gsc/metrics", error);
    return NextResponse.json({ error: "Could not disconnect GSC" }, { status: 500 });
  }
});
