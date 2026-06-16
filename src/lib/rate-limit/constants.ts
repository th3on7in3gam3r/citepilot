/** CitePilot Insights requests per user per hour (Pilot+). */
export const COPILOT_RATE_LIMIT_PER_HOUR = 20;

/** Manual Autopilot runs per user per hour (Pilot+). */
export const AUTOPILOT_MANUAL_LIMIT_PER_HOUR = 5;

/** Public /audit landing audits per IP per hour (unauthenticated). */
export const AUDIT_PUBLIC_RATE_LIMIT_PER_HOUR = 8;

/** Authenticated citation audits per user per hour. */
export const AUDIT_AUTH_RATE_LIMIT_PER_HOUR = 30;

/** Workspace list/create API calls per signed-in user per hour. */
export const WORKSPACES_RATE_LIMIT_PER_HOUR = 120;

/** Waitlist signups per IP per hour. */
export const WAITLIST_RATE_LIMIT_PER_HOUR = 10;

/** Blog newsletter signups per IP per hour. */
export const SUBSCRIBE_RATE_LIMIT_PER_HOUR = 1;

/** Prompt CSV imports per user per hour. */
export const PROMPT_IMPORT_RATE_LIMIT_PER_HOUR = 3;

/** Max prompts per import batch. */
export const PROMPT_IMPORT_MAX_PER_BATCH = 200;
