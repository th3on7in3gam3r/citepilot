import { dbGet, dbRun } from "@/lib/db";
import { FLEET_API_RATE_LIMIT_PER_HOUR } from "@/lib/fleet/constants";

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: string;
};

function hourWindowKey(date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const h = String(date.getUTCHours()).padStart(2, "0");
  return `${y}-${m}-${d}T${h}`;
}

function nextHourIso(date = new Date()): string {
  const next = new Date(date);
  next.setUTCMinutes(0, 0, 0);
  next.setUTCHours(next.getUTCHours() + 1);
  return next.toISOString();
}

export async function checkFleetRateLimit(
  subject: string,
  limit = FLEET_API_RATE_LIMIT_PER_HOUR,
): Promise<RateLimitResult> {
  const windowKey = hourWindowKey();
  const row = await dbGet<{ request_count: number }>(
    `SELECT request_count FROM fleet_api_usage WHERE subject = ? AND window_key = ?`,
    [subject, windowKey],
  );
  const count = Number(row?.request_count ?? 0);
  const allowed = count < limit;

  if (allowed) {
    await dbRun(
      `INSERT INTO fleet_api_usage (subject, window_key, request_count)
       VALUES (?, ?, 1)
       ON CONFLICT(subject, window_key) DO UPDATE SET
         request_count = request_count + 1`,
      [subject, windowKey],
    );
  }

  const nextCount = allowed ? count + 1 : count;
  return {
    allowed,
    limit,
    remaining: Math.max(0, limit - nextCount),
    resetAt: nextHourIso(),
  };
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": result.resetAt,
  };
}
