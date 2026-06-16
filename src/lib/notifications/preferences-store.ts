import { randomUUID } from "crypto";
import { dbGet, dbRun } from "@/lib/db";
import {
  defaultWorkspacePreferences,
  mergePreferences,
  parsePreferences,
  type ScoreDropThresholdPercent,
  type WorkspacePreferences,
} from "@/lib/settings";
import { updateWorkspace } from "@/lib/server/workspace";

export const WEBHOOK_EVENT_OPTIONS = [
  "audit.completed",
  "citation.change_detected",
  "prompt.limit_reached",
] as const;

export type WebhookEventType = (typeof WEBHOOK_EVENT_OPTIONS)[number];

export type NotificationPreferences = {
  emailWeeklyDigest: boolean;
  digestDay: number;
  digestHour: number;
  digestTimezone: string;
  emailDropAlerts: boolean;
  dropThreshold: ScoreDropThresholdPercent;
  emailCompetitorAlerts: boolean;
  slackWeekly: boolean;
  slackDropAlerts: boolean;
  webhookEvents: WebhookEventType[];
};

export const defaultNotificationPreferences: NotificationPreferences = {
  emailWeeklyDigest: true,
  digestDay: 1,
  digestHour: 9,
  digestTimezone: "UTC",
  emailDropAlerts: true,
  dropThreshold: 10,
  emailCompetitorAlerts: true,
  slackWeekly: true,
  slackDropAlerts: true,
  webhookEvents: ["audit.completed", "citation.change_detected"],
};

type NotificationPreferencesRow = {
  id: string;
  user_id: string;
  workspace_id: string;
  email_weekly_digest: number | boolean;
  digest_day: number;
  digest_hour: number;
  digest_timezone: string;
  email_drop_alerts: number | boolean;
  drop_threshold: number;
  email_competitor_alerts: number | boolean;
  slack_weekly: number | boolean;
  slack_drop_alerts: number | boolean;
  webhook_events: string;
  created_at: string;
  updated_at: string;
};

function asBool(value: number | boolean | null | undefined): boolean {
  if (typeof value === "boolean") return value;
  return value === 1;
}

function parseWebhookEvents(raw: string | null | undefined): WebhookEventType[] {
  if (!raw) return [...defaultNotificationPreferences.webhookEvents];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [...defaultNotificationPreferences.webhookEvents];
    return parsed.filter((item): item is WebhookEventType =>
      WEBHOOK_EVENT_OPTIONS.includes(item as WebhookEventType),
    );
  } catch {
    return [...defaultNotificationPreferences.webhookEvents];
  }
}

function normalizeDropThreshold(value: number): ScoreDropThresholdPercent {
  if (value === 5 || value === 10 || value === 20) return value;
  return defaultNotificationPreferences.dropThreshold;
}

function normalizeDigestDay(value: number): number {
  if (value >= 0 && value <= 6) return value;
  return defaultNotificationPreferences.digestDay;
}

function normalizeDigestHour(value: number): number {
  if (value >= 0 && value <= 23) return value;
  return defaultNotificationPreferences.digestHour;
}

export function rowToNotificationPreferences(
  row: NotificationPreferencesRow,
): NotificationPreferences {
  return {
    emailWeeklyDigest: asBool(row.email_weekly_digest),
    digestDay: normalizeDigestDay(row.digest_day),
    digestHour: normalizeDigestHour(row.digest_hour),
    digestTimezone: row.digest_timezone?.trim() || "UTC",
    emailDropAlerts: asBool(row.email_drop_alerts),
    dropThreshold: normalizeDropThreshold(row.drop_threshold),
    emailCompetitorAlerts: asBool(row.email_competitor_alerts),
    slackWeekly: asBool(row.slack_weekly),
    slackDropAlerts: asBool(row.slack_drop_alerts),
    webhookEvents: parseWebhookEvents(row.webhook_events),
  };
}

function notificationPrefsFromWorkspace(
  preferences: WorkspacePreferences,
): NotificationPreferences {
  return {
    ...defaultNotificationPreferences,
    emailWeeklyDigest: preferences.weeklyDigest,
    digestDay: preferences.weeklyDigestDay,
    emailDropAlerts: preferences.scoreDropAlerts,
    dropThreshold: preferences.scoreDropThresholdPercent,
    emailCompetitorAlerts: preferences.competitorMoveAlerts,
  };
}

function workspacePatchFromNotificationPrefs(
  patch: Partial<NotificationPreferences>,
): Partial<WorkspacePreferences> {
  const next: Partial<WorkspacePreferences> = {};
  if (patch.emailWeeklyDigest !== undefined) {
    next.weeklyDigest = patch.emailWeeklyDigest;
  }
  if (patch.digestDay !== undefined) {
    next.weeklyDigestDay = patch.digestDay;
  }
  if (patch.emailDropAlerts !== undefined) {
    next.scoreDropAlerts = patch.emailDropAlerts;
  }
  if (patch.dropThreshold !== undefined) {
    next.scoreDropThresholdPercent = patch.dropThreshold;
  }
  if (patch.emailCompetitorAlerts !== undefined) {
    next.competitorMoveAlerts = patch.emailCompetitorAlerts;
  }
  return next;
}

export async function ensureNotificationPreferences(input: {
  workspaceId: string;
  userId: string;
}): Promise<NotificationPreferences> {
  const existing = await dbGet<NotificationPreferencesRow>(
    `SELECT * FROM notification_preferences WHERE workspace_id = ?`,
    [input.workspaceId],
  );
  if (existing) return rowToNotificationPreferences(existing);

  const ws = await dbGet<{ preferences: string; user_id: string | null }>(
    `SELECT preferences, user_id FROM workspaces WHERE id = ?`,
    [input.workspaceId],
  );
  const workspacePrefs = parsePreferences(ws?.preferences);
  const defaults = notificationPrefsFromWorkspace(workspacePrefs);
  const now = new Date().toISOString();
  const id = randomUUID();

  await dbRun(
    `INSERT INTO notification_preferences (
      id, user_id, workspace_id,
      email_weekly_digest, digest_day, digest_hour, digest_timezone,
      email_drop_alerts, drop_threshold, email_competitor_alerts,
      slack_weekly, slack_drop_alerts, webhook_events,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.userId,
      input.workspaceId,
      defaults.emailWeeklyDigest ? 1 : 0,
      defaults.digestDay,
      defaults.digestHour,
      defaults.digestTimezone,
      defaults.emailDropAlerts ? 1 : 0,
      defaults.dropThreshold,
      defaults.emailCompetitorAlerts ? 1 : 0,
      defaults.slackWeekly ? 1 : 0,
      defaults.slackDropAlerts ? 1 : 0,
      JSON.stringify(defaults.webhookEvents),
      now,
      now,
    ],
  );

  return defaults;
}

export async function createDefaultNotificationPreferences(input: {
  workspaceId: string;
  userId: string;
}): Promise<void> {
  await ensureNotificationPreferences(input);
}

export async function getNotificationPreferences(
  workspaceId: string,
  userId: string,
): Promise<NotificationPreferences> {
  return ensureNotificationPreferences({ workspaceId, userId });
}

export type NotificationPreferencesPatch = Partial<NotificationPreferences> & {
  monitoringEmail?: string;
};

export async function patchNotificationPreferences(input: {
  workspaceId: string;
  userId: string;
  section: "email" | "slack" | "webhooks";
  patch: NotificationPreferencesPatch;
}): Promise<NotificationPreferences> {
  const current = await ensureNotificationPreferences({
    workspaceId: input.workspaceId,
    userId: input.userId,
  });

  const merged: NotificationPreferences = {
    ...current,
    ...input.patch,
    webhookEvents: input.patch.webhookEvents ?? current.webhookEvents,
  };

  if (input.section === "email") {
    merged.digestDay = normalizeDigestDay(merged.digestDay);
    merged.digestHour = normalizeDigestHour(merged.digestHour);
    merged.dropThreshold = normalizeDropThreshold(merged.dropThreshold);
  }

  const now = new Date().toISOString();
  await dbRun(
    `UPDATE notification_preferences SET
      email_weekly_digest = ?,
      digest_day = ?,
      digest_hour = ?,
      digest_timezone = ?,
      email_drop_alerts = ?,
      drop_threshold = ?,
      email_competitor_alerts = ?,
      slack_weekly = ?,
      slack_drop_alerts = ?,
      webhook_events = ?,
      updated_at = ?
     WHERE workspace_id = ? AND user_id = ?`,
    [
      merged.emailWeeklyDigest ? 1 : 0,
      merged.digestDay,
      merged.digestHour,
      merged.digestTimezone,
      merged.emailDropAlerts ? 1 : 0,
      merged.dropThreshold,
      merged.emailCompetitorAlerts ? 1 : 0,
      merged.slackWeekly ? 1 : 0,
      merged.slackDropAlerts ? 1 : 0,
      JSON.stringify(merged.webhookEvents),
      now,
      input.workspaceId,
      input.userId,
    ],
  );

  if (input.section === "email") {
    const ws = await dbGet<{ preferences: string }>(
      `SELECT preferences FROM workspaces WHERE id = ?`,
      [input.workspaceId],
    );
    const workspacePrefs = parsePreferences(ws?.preferences);
    const workspacePatch = workspacePatchFromNotificationPrefs(input.patch);
    const nextPrefs = mergePreferences(workspacePrefs, {
      ...workspacePatch,
      ...(input.patch.monitoringEmail !== undefined
        ? { monitoringEmail: input.patch.monitoringEmail.trim() }
        : {}),
    });
    await updateWorkspace(
      input.workspaceId,
      { preferences: nextPrefs },
      input.userId,
    );
  }

  return merged;
}

export function isDigestDayDue(
  prefs: NotificationPreferences,
  now = new Date(),
): boolean {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: prefs.digestTimezone || "UTC",
      weekday: "short",
    });
    const weekday = formatter.format(now);
    const weekdayMap: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };
    const day = weekdayMap[weekday];
    if (day === undefined) return false;
    return day === prefs.digestDay;
  } catch {
    return isWeeklyDigestDayUtc(prefs.digestDay, now);
  }
}

export function isDigestDueNow(
  prefs: NotificationPreferences,
  now = new Date(),
): boolean {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: prefs.digestTimezone || "UTC",
      weekday: "short",
      hour: "numeric",
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
    const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "-1");

    const weekdayMap: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };
    const day = weekdayMap[weekday];
    if (day === undefined) return false;
    return day === prefs.digestDay && hour === prefs.digestHour;
  } catch {
    return isWeeklyDigestDayUtc(prefs.digestDay, now) && now.getUTCHours() === prefs.digestHour;
  }
}

export function isWeeklyDigestDayUtc(prefsDay: number, now = new Date()): boolean {
  return now.getUTCDay() === prefsDay;
}

export function webhookEventEnabled(
  prefs: NotificationPreferences,
  event: WebhookEventType,
): boolean {
  return prefs.webhookEvents.includes(event);
}
