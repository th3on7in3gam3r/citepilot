import * as Sentry from "@sentry/nextjs";

// SENTRY_DSN is injected into the client bundle at build time by @sentry/nextjs.
const dsn = process.env.SENTRY_DSN?.trim();

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
  tracesSampleRate: 0,
  sendDefaultPii: false,
});
