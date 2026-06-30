import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { PILOT_UPGRADE_MESSAGE, userHasPilotAccess } from "@/lib/billing/access";
import { withApiLogging } from "@/lib/observability/api-log";
import { getWorkspaceById } from "@/lib/server/workspace";
import { assertMonitorQuota } from "@/lib/uptime/limits";
import { createMonitor, listMonitors } from "@/lib/uptime/store";
import type { CreateMonitorInput, MonitorType } from "@/lib/uptime/types";

export const runtime = "nodejs";

const VALID_TYPES: MonitorType[] = [
  "http",
  "ping",
  "keyword",
  "ssl",
  "port",
  "cron",
];

export const GET = withApiLogging(async function GET(request: Request) {
  const user = await requireApiUser(request);
  if (user instanceof NextResponse) return user;
  const userId = apiUserId(user);
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId")?.trim() || undefined;

  const monitors = await listMonitors({ userId, workspaceId });
  return NextResponse.json({ monitors });
});

export const POST = withApiLogging(async function POST(request: Request) {
  const user = await requireApiUser(request);
  if (user instanceof NextResponse) return user;
  const userId = apiUserId(user);
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  if (!(await userHasPilotAccess(userId))) {
    return NextResponse.json(
      { error: PILOT_UPGRADE_MESSAGE, code: "PILOT_REQUIRED" },
      { status: 402 },
    );
  }

  const body = (await request.json()) as CreateMonitorInput;
  const workspaceId = body.workspaceId?.trim();
  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
  }

  const ws = await getWorkspaceById(workspaceId, userId);
  if (!ws) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (!body.url?.trim()) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }
  if (!VALID_TYPES.includes(body.monitorType)) {
    return NextResponse.json({ error: "Invalid monitorType" }, { status: 400 });
  }

  const quota = await assertMonitorQuota(userId);
  if (!quota.allowed) {
    return NextResponse.json(
      {
        error: `Monitor limit reached (${quota.count}/${quota.limit}). Upgrade for more monitors.`,
        code: "MONITOR_LIMIT",
      },
      { status: 402 },
    );
  }

  const monitor = await createMonitor(userId, body);
  return NextResponse.json({ monitor }, { status: 201 });
});
