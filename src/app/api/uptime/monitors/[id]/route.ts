import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { withApiLogging } from "@/lib/observability/api-log";
import {
  deleteMonitor,
  getMonitorById,
  updateMonitor,
} from "@/lib/uptime/store";
import type { UpdateMonitorInput } from "@/lib/uptime/types";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withApiLogging(async function GET(
  request: Request,
  context: RouteContext,
) {
  const user = await requireApiUser(request);
  if (user instanceof NextResponse) return user;
  const userId = apiUserId(user);
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id } = await context.params;
  const monitor = await getMonitorById(id, userId);
  if (!monitor) {
    return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
  }

  return NextResponse.json({ monitor });
});

export const PATCH = withApiLogging(async function PATCH(
  request: Request,
  context: RouteContext,
) {
  const user = await requireApiUser(request);
  if (user instanceof NextResponse) return user;
  const userId = apiUserId(user);
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as UpdateMonitorInput;
  if (body.monitorType && !["http", "ping", "keyword", "ssl", "port", "cron"].includes(body.monitorType)) {
    return NextResponse.json({ error: "Invalid monitorType" }, { status: 400 });
  }

  const monitor = await updateMonitor(id, userId, body);
  if (!monitor) {
    return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
  }

  return NextResponse.json({ monitor });
});

export const DELETE = withApiLogging(async function DELETE(
  request: Request,
  context: RouteContext,
) {
  const user = await requireApiUser(request);
  if (user instanceof NextResponse) return user;
  const userId = apiUserId(user);
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id } = await context.params;
  const ok = await deleteMonitor(id, userId);
  if (!ok) {
    return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
});
