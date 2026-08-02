import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { requireWorkspaceAccess } from "@/lib/auth/workspace-access";
import {
  PILOT_UPGRADE_MESSAGE,
  userHasPilotAccess,
} from "@/lib/billing/access";
import { dbGet, dbRun } from "@/lib/db";
import {
  computeNextScanAt,
  formatNextScanDisplay,
} from "@/lib/scans/schedule";
import {
  mergePreferences,
  parsePreferences,
  type ScanScheduleHour,
  type ScanSchedulePreferences,
} from "@/lib/settings";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

function parseScheduleBody(body: Record<string, unknown>): ScanSchedulePreferences | null {
  const frequency =
    body.frequency === "weekly" ||
    body.frequency === "biweekly" ||
    body.frequency === "monthly"
      ? body.frequency
      : null;
  const dayOfWeek =
    typeof body.dayOfWeek === "number" && body.dayOfWeek >= 0 && body.dayOfWeek <= 6
      ? body.dayOfWeek
      : null;
  const hour =
    body.hour === 6 || body.hour === 8 || body.hour === 10 || body.hour === 12
      ? (body.hour as ScanScheduleHour)
      : null;
  const timezone =
    typeof body.timezone === "string" && body.timezone.trim()
      ? body.timezone.trim()
      : null;

  if (frequency == null || dayOfWeek == null || hour == null || !timezone) {
    return null;
  }

  return { frequency, dayOfWeek, hour, timezone };
}

export const GET = withApiLogging(async function GET(
  _request: Request,
  context: RouteContext,
) {
  const auth = await requireApiUser(_request);
  if (auth instanceof NextResponse) return auth;
  const userId = apiUserId(auth);
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id: workspaceId } = await context.params;
  const access = await requireWorkspaceAccess(userId, workspaceId, "editor");
  if (!access) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const row = await dbGet<{
    preferences: string;
    next_scan_at: string | null;
    status: string | null;
  }>(`SELECT preferences, next_scan_at, status FROM workspaces WHERE id = ?`, [
    workspaceId,
  ]);
  if (!row) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const prefs = parsePreferences(row.preferences);
  return NextResponse.json({
    ok: true,
    schedule: prefs.scanSchedule,
    nextScanAt: row.next_scan_at,
    nextScanLabel: formatNextScanDisplay(
      row.next_scan_at,
      prefs.scanSchedule.timezone,
    ),
    paused: row.status === "paused",
  });
});

export const PATCH = withApiLogging(async function PATCH(
  request: Request,
  context: RouteContext,
) {
  const auth = await requireApiUser(request);
  if (auth instanceof NextResponse) return auth;
  const userId = apiUserId(auth);
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  if (!(await userHasPilotAccess(userId))) {
    return NextResponse.json({ error: PILOT_UPGRADE_MESSAGE }, { status: 403 });
  }

  const { id: workspaceId } = await context.params;
  const access = await requireWorkspaceAccess(userId, workspaceId, "editor");
  if (!access) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const row = await dbGet<{ preferences: string; status: string | null }>(
    `SELECT preferences, status FROM workspaces WHERE id = ?`,
    [workspaceId],
  );
  if (!row) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const current = parsePreferences(row.preferences);
  const schedule = parseScheduleBody(body);
  if (!schedule) {
    return NextResponse.json({ error: "Invalid schedule payload" }, { status: 400 });
  }

  const merged = mergePreferences(current, { scanSchedule: schedule });
  const nextScanAt = computeNextScanAt(schedule);
  const now = new Date().toISOString();

  let status = row.status ?? "active";
  if (typeof body.paused === "boolean") {
    status = body.paused ? "paused" : "active";
  }

  await dbRun(
    `UPDATE workspaces
     SET preferences = ?, next_scan_at = ?, status = ?, updated_at = ?
     WHERE id = ?`,
    [JSON.stringify(merged), nextScanAt, status, now, workspaceId],
  );

  return NextResponse.json({
    ok: true,
    schedule: merged.scanSchedule,
    nextScanAt,
    nextScanLabel: formatNextScanDisplay(nextScanAt, schedule.timezone),
    paused: status === "paused",
  });
});
