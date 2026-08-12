/**
 * Map Neon Auth / Better Auth client+server errors to safe UI copy.
 */

const NEON_QUOTA_MESSAGE =
  "Sign-in is temporarily unavailable — our auth provider hit a Neon usage quota. Try again after the quota resets, or contact support.";

const RATE_LIMIT_MESSAGE =
  "Sign-in is temporarily rate-limited. Wait a minute and try again.";

const MISCONFIGURED_MESSAGE =
  "Auth service is misconfigured. Try email sign-in, or contact support.";

function collectAuthErrorText(err: unknown): string {
  const parts: string[] = [];

  const walk = (value: unknown, depth: number) => {
    if (value == null || depth > 4) return;
    if (typeof value === "string") {
      parts.push(value);
      return;
    }
    if (typeof value === "number" || typeof value === "boolean") {
      parts.push(String(value));
      return;
    }
    if (value instanceof Error) {
      parts.push(value.message);
      walk((value as Error & { cause?: unknown }).cause, depth + 1);
      return;
    }
    if (typeof value === "object") {
      const record = value as Record<string, unknown>;
      for (const key of [
        "message",
        "code",
        "status",
        "statusText",
        "error",
        "detail",
        "cause",
      ]) {
        if (key in record) walk(record[key], depth + 1);
      }
      return;
    }
  };

  walk(err, 0);
  return parts.join(" ").toLowerCase();
}

export function isNeonQuotaAuthError(err: unknown): boolean {
  const text = collectAuthErrorText(err);
  return (
    text.includes("data transfer quota") ||
    text.includes("exceeded the data transfer") ||
    text.includes("compute_quota") ||
    text.includes("quota_exceeded") ||
    text.includes("upgrade your plan to increase limits") ||
    (text.includes("53000") && text.includes("quota")) ||
    (text.includes("database_error") &&
      (text.includes("quota") || text.includes("53000")))
  );
}

export function isAuthRateLimitError(err: unknown, status?: number): boolean {
  if (status === 429) return true;
  const text = collectAuthErrorText(err);
  return (
    text.includes("429") ||
    text.includes("rate limit") ||
    text.includes("rate-limited") ||
    text.includes("too many requests")
  );
}

export function isAuthMisconfiguredError(err: unknown, status?: number): boolean {
  if (status === 404) return true;
  const text = collectAuthErrorText(err);
  return (
    text.includes("endpoint not found") ||
    (text.includes("404") && text.includes("not found"))
  );
}

/**
 * Prefer specific operational failures (quota / rate limit / misconfig)
 * over a generic fallback.
 */
export function mapAuthSignInError(
  err: unknown,
  fallback = "Sign-in failed — try again or use email.",
): string {
  const status =
    typeof err === "object" &&
    err !== null &&
    "status" in err &&
    typeof (err as { status?: unknown }).status === "number"
      ? (err as { status: number }).status
      : undefined;

  if (isNeonQuotaAuthError(err)) return NEON_QUOTA_MESSAGE;
  if (isAuthRateLimitError(err, status)) return RATE_LIMIT_MESSAGE;
  if (isAuthMisconfiguredError(err, status)) return MISCONFIGURED_MESSAGE;
  return fallback;
}
