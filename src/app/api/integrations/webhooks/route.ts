import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import {
  createWebhookEndpoint,
  deleteWebhookEndpoint,
  listWebhookEndpoints,
} from "@/lib/alerts/store";
import { userHasFleetAccess } from "@/lib/billing/access";
import { getWorkspaceById } from "@/lib/server/workspace";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

async function authorizeFleet(request: Request) {
  const user = await requireApiUser(request);
  if (user instanceof NextResponse) return user;
  const userId = apiUserId(user);
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  if (!(await userHasFleetAccess(userId))) {
    return NextResponse.json({ error: "Fleet plan required" }, { status: 403 });
  }
  return { userId };
}

export const GET = withApiLogging(async function GET(request: Request) {
  const auth = await authorizeFleet(request);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId")?.trim();
  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  }

  const ws = await getWorkspaceById(workspaceId, auth.userId);
  if (!ws) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const rows = await listWebhookEndpoints(workspaceId, auth.userId);
  return NextResponse.json({
    endpoints: rows.map((r) => ({
      id: r.id,
      url: r.url,
      createdAt: r.created_at,
    })),
  });
});

export const POST = withApiLogging(async function POST(request: Request) {
  const auth = await authorizeFleet(request);
  if (auth instanceof NextResponse) return auth;

  const body = (await request.json()) as {
    workspaceId?: string;
    url?: string;
    secret?: string;
  };
  const workspaceId = body.workspaceId?.trim();
  const url = body.url?.trim();
  const secret = body.secret?.trim();

  if (!workspaceId || !url || !secret) {
    return NextResponse.json(
      { error: "workspaceId, url, and secret required" },
      { status: 400 },
    );
  }

  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const ws = await getWorkspaceById(workspaceId, auth.userId);
  if (!ws) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const row = await createWebhookEndpoint({
    userId: auth.userId,
    workspaceId,
    url,
    secret,
  });

  return NextResponse.json({
    id: row.id,
    url: row.url,
    createdAt: row.created_at,
  });
});

export const DELETE = withApiLogging(async function DELETE(request: Request) {
  const auth = await authorizeFleet(request);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId")?.trim();
  const id = searchParams.get("id")?.trim();
  if (!workspaceId || !id) {
    return NextResponse.json({ error: "workspaceId and id required" }, { status: 400 });
  }

  const removed = await deleteWebhookEndpoint(id, workspaceId, auth.userId);
  if (!removed) {
    return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
});
