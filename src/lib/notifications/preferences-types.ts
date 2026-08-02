import type { ScoreDropThresholdPercent } from "@/lib/settings";

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

export type NotificationPreferencesPatch = Partial<NotificationPreferences> & {
  monitoringEmail?: string;
};

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
    return (
      isWeeklyDigestDayUtc(prefs.digestDay, now) &&
      now.getUTCHours() === prefs.digestHour
    );
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
