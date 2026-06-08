import * as Sentry from "@sentry/nextjs";

export function isSentryEnabled(): boolean {
  return Boolean(process.env.SENTRY_DSN?.trim());
}

export function captureServerException(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  if (!isSentryEnabled()) return;
  Sentry.captureException(error, context ? { extra: context } : undefined);
}

export function captureServerMessage(
  message: string,
  level: Sentry.SeverityLevel = "warning",
  context?: Record<string, unknown>,
): void {
  if (!isSentryEnabled()) return;
  Sentry.captureMessage(message, { level, extra: context });
}
