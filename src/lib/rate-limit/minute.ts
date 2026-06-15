import { dbGet, dbRun, isPostgres } from "@/lib/db";

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: string;
};

function minuteWindowKey(date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const h = String(date.getUTCHours()).padStart(2, "0");
  const min = String(date.getUTCMinutes()).padStart(2, "0");
  return `${y}-${m}-${d}T${h}:${min}`;
}

function nextMinuteIso(date = new Date()): string {
  const next = new Date(date);
  next.setUTCSeconds(0, 0);
  next.setUTCMinutes(next.getUTCMinutes() + 1);
  return next.toISOString();
}

export async function checkMinuteRateLimit(
  subject: string,
  limit: number,
): Promise<RateLimitResult> {
  const windowKey = `m:${minuteWindowKey()}`;
  const row = await dbGet<{ request_count: number }>(
    `SELECT request_count FROM fleet_api_usage WHERE subject = ? AND window_key = ?`,
    [subject, windowKey],
  );
  const count = Number(row?.request_count ?? 0);
  const allowed = count < limit;

  if (allowed) {
    const incrementSql = isPostgres()
      ? `INSERT INTO fleet_api_usage (subject, window_key, request_count)
         VALUES (?, ?, 1)
         ON CONFLICT (subject, window_key) DO UPDATE SET
           request_count = fleet_api_usage.request_count + 1`
      : `INSERT INTO fleet_api_usage (subject, window_key, request_count)
         VALUES (?, ?, 1)
         ON CONFLICT(subject, window_key) DO UPDATE SET
           request_count = request_count + 1`;
    await dbRun(incrementSql, [subject, windowKey]);
  }

  const nextCount = allowed ? count + 1 : count;
  return {
    allowed,
    limit,
    remaining: Math.max(0, limit - nextCount),
    resetAt: nextMinuteIso(),
  };
}
