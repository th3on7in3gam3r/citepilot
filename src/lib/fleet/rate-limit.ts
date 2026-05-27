import { FLEET_API_RATE_LIMIT_PER_HOUR } from "@/lib/fleet/constants";
import {
  checkHourlyRateLimit,
  rateLimitHeaders,
  type RateLimitResult,
} from "@/lib/rate-limit/hourly";

export type { RateLimitResult };

export async function checkFleetRateLimit(
  subject: string,
  limit = FLEET_API_RATE_LIMIT_PER_HOUR,
): Promise<RateLimitResult> {
  return checkHourlyRateLimit(subject, limit);
}

export { rateLimitHeaders };
