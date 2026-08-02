/** Fleet REST API requests per rolling minute per key or session. */
export const FLEET_API_RATE_LIMIT_PER_MINUTE = 100;

/** Fleet REST API requests per rolling hour per key or session. */
export const FLEET_API_RATE_LIMIT_PER_HOUR = 1000;

/** Max audit trigger requests per hour (all plans, v1 API). */
export const FLEET_AUDIT_TRIGGER_LIMIT_PER_HOUR = 10;

/** Max API keys per Fleet user (per workspace when scoped). */
export const FLEET_API_KEYS_MAX = 5;

/** Live API key prefix shown in docs and dashboard. */
export const FLEET_API_KEY_PREFIX = "ck_live_";

/** Legacy prefix — still accepted for verification during migration. */
export const FLEET_API_KEY_LEGACY_PREFIX = "cp_fleet_";

export function isFleetApiKeySecret(value: string): boolean {
  return (
    value.startsWith(FLEET_API_KEY_PREFIX) ||
    value.startsWith(FLEET_API_KEY_LEGACY_PREFIX)
  );
}
