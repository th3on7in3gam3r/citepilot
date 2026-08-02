import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { getSessionUser } from "@/lib/auth/server";
import { userHasFleetAccess, userHasPilotAccess } from "@/lib/billing/access";
import { getSlackConnection } from "@/lib/alerts/store";
import { dispatchWeeklySlackDigest } from "@/lib/alerts/dispatch";
import {
  getNotificationPreferences,
  patchNotificationPreferences,
  type NotificationPreferences,
  type WebhookEventType,
  WEBHOOK_EVENT_OPTIONS,
} from "@/lib/notifications/preferences-store";
import { getWorkspaceById } from "@/lib/server/workspace";
import { withApiLogging } from "@/lib/observability/api-log";
import type { ScoreDropThresholdPercent } from "@/lib/settings";

export const runtime = "nodejs";

function parseSection(value: unknown): "email" | "slack" | "webhooks" | null {
  if (value === "email" || value === "slack" || value === "webhooks") {
    return value;
  }
  return null;
}

function parseEmailPatch(body: Record<string, unknown>) {
  const patch: Partial<NotificationPreferences> & { monitoringEmail?: string } =
    {};

  if (typeof body.emailWeeklyDigest === "boolean") {
    patch.emailWeeklyDigest = body.emailWeeklyDigest;
  }
  if (typeof body.digestDay === "number") {
    patch.digestDay = body.digestDay;
  }
  if (typeof body.digestHour === "number") {
    patch.digestHour = body.digestHour;
  }
  if (typeof body.digestTimezone === "string" && body.digestTimezone.trim()) {
    patch.digestTimezone = body.digestTimezone.trim();
  }
  if (typeof body.emailDropAlerts === "boolean") {
    patch.emailDropAlerts = body.emailDropAlerts;
  }
  if (typeof body.dropThreshold === "number") {
    const t = body.dropThreshold;
    if (t === 5 || t === 10 || t === 20) {
      patch.dropThreshold = t as ScoreDropThresholdPercent;
    }
  }
  if (typeof body.emailCompetitorAlerts === "boolean") {
    patch.emailCompetitorAlerts = body.emailCompetitorAlerts;
  }
  if (typeof body.monitoringEmail === "string") {
    patch.monitoringEmail = body.monitoringEmail;
  }

  return patch;
}

function parseSlackPatch(body: Record<string, unknown>) {
  const patch: Partial<NotificationPreferences> = {};
  if (typeof body.slackWeekly === "boolean") patch.slackWeekly = body.slackWeekly;
  if (typeof body.slackDropAlerts === "boolean") {
    patch.slackDropAlerts = body.slackDropAlerts;
  }
  return patch;
}

function parseWebhookPatch(body: Record<string, unknown>) {
  const patch: Partial<NotificationPreferences> = {};
  if (Array.isArray(body.webhookEvents)) {
    patch.webhookEvents = body.webhookEvents.filter((item): item is WebhookEventType =>
      typeof item === "string" &&
      WEBHOOK_EVENT_OPTIONS.includes(item as WebhookEventType),
    );
  }
  return patch;
}

export const GET = withApiLogging(async function GET(request: Request) {
  const auth = await requireApiUser(request);
  if (auth instanceof NextResponse) return auth;
  const userId = apiUserId(auth);
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

  const preferences = await getNotificationPreferences(workspaceId, userId);
  const slack = await getSlackConnection(workspaceId, userId);

  return NextResponse.json({
    preferences,
    monitoringEmail: ws.preferences.monitoringEmail ?? "",
    slack: {
      connected: Boolean(slack?.slack_channel_id),
      teamName: slack?.slack_team_name ?? null,
      channelId: slack?.slack_channel_id ?? null,
      channelName: slack?.slack_channel_name ?? null,
    },
  });
});

export const PATCH = withApiLogging(async function PATCH(request: Request) {
  const auth = await requireApiUser(request);
  if (auth instanceof NextResponse) return auth;
  const userId = apiUserId(auth);
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const workspaceId =
    typeof body.workspaceId === "string" ? body.workspaceId.trim() : "";
  const section = parseSection(body.section);

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  }
  if (!section) {
    return NextResponse.json(
      { error: 'section must be "email", "slack", or "webhooks"' },
      { status: 400 },
    );
  }

  const ws = await getWorkspaceById(workspaceId, userId);
  if (!ws) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const paid =
    (await userHasPilotAccess(userId)) || (await userHasFleetAccess(userId));
  if (!paid && section === "email") {
    return NextResponse.json({ error: "Pilot or Fleet required" }, { status: 403 });
  }
  if (!(await userHasFleetAccess(userId)) && section === "webhooks") {
    return NextResponse.json({ error: "Fleet plan required" }, { status: 403 });
  }

  const patch =
    section === "email"
      ? parseEmailPatch(body)
      : section === "slack"
        ? parseSlackPatch(body)
        : parseWebhookPatch(body);

  const preferences = await patchNotificationPreferences({
    workspaceId,
    userId,
    section,
    patch,
  });

  return NextResponse.json({ ok: true, preferences });
});
