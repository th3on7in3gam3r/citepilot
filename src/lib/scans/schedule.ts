import type { ScanSchedulePreferences } from "@/lib/settings";

const WEEKDAY_TO_NUMBER: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function localParts(date: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "Mon";
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return {
    dayOfWeek: WEEKDAY_TO_NUMBER[weekday] ?? 1,
    hour,
    minute,
  };
}

function addInterval(date: Date, frequency: ScanSchedulePreferences["frequency"]): Date {
  const next = new Date(date);
  if (frequency === "weekly") {
    next.setUTCDate(next.getUTCDate() + 7);
  } else if (frequency === "biweekly") {
    next.setUTCDate(next.getUTCDate() + 14);
  } else {
    next.setUTCMonth(next.getUTCMonth() + 1);
  }
  return next;
}

/** Find the next UTC instant matching schedule day/hour in the given timezone. */
export function computeNextScanAt(
  schedule: ScanSchedulePreferences,
  after: Date = new Date(),
): string {
  let cursor = new Date(after.getTime() + 60_000);
  cursor.setUTCSeconds(0, 0);

  for (let step = 0; step < 24 * 400; step++) {
    cursor = new Date(Math.ceil(cursor.getTime() / 3_600_000) * 3_600_000);
    const parts = localParts(cursor, schedule.timezone);
    if (parts.dayOfWeek === schedule.dayOfWeek && parts.hour === schedule.hour) {
      if (cursor > after) {
        return cursor.toISOString();
      }
    }
    cursor = new Date(cursor.getTime() + 3_600_000);
  }

  return addInterval(after, schedule.frequency).toISOString();
}

export function advanceNextScanAt(
  schedule: ScanSchedulePreferences,
  previous: string,
): string {
  const base = new Date(previous);
  const bumped = addInterval(base, schedule.frequency);
  return computeNextScanAt(schedule, new Date(bumped.getTime() - 60_000));
}

export function formatNextScanDisplay(
  iso: string | null | undefined,
  timezone: string,
): string {
  if (!iso) return "Not scheduled";
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    timeZone: timezone,
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}
