import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { withApiLogging } from "@/lib/observability/api-log";
import { getMonitorById } from "@/lib/uptime/store";
import { runSingleMonitor } from "@/lib/uptime/runner";

export const runtime = "nodejs";
export const maxDuration = 30;

type RouteContext = { params: Promise<{ id: string }> };

export const POST = withApiLogging(async function POST(
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

  await runSingleMonitor(monitor, userId);
  const updated = await getMonitorById(id, userId);
  return NextResponse.json({ monitor: updated });
});
