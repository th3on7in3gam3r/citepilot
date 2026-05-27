import posthog from "posthog-js";

export type AnalyticsEvent =
  | "audit_started"
  | "audit_completed"
  | "signup_started"
  | "signup_completed"
  | "workspace_created"
  | "pilot_checkout_started"
  | "fleet_checkout_started"
  | "cms_published"
  | "second_audit_completed"
  | "insights_completed"
  | "autopilot_run";

type TrackProps = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    plausible?: (
      event: string,
      options?: { props?: Record<string, string | number> },
    ) => void;
  }
}

export function trackAuditCompleted(
  workspaceId: string,
  options?: { isSecond?: boolean; source?: string },
): void {
  trackEvent(
    options?.isSecond ? "second_audit_completed" : "audit_completed",
    { workspaceId, source: options?.source },
  );
}

export function trackEvent(name: AnalyticsEvent, props?: TrackProps): void {
  if (typeof window === "undefined") return;

  const payload = props
    ? Object.fromEntries(
        Object.entries(props)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)]),
      )
    : undefined;

  try {
    window.plausible?.(name, payload ? { props: payload } : undefined);
  } catch {
    /* ignore */
  }

  try {
    if (posthog.__loaded) {
      posthog.capture(name, props);
    }
  } catch {
    /* ignore */
  }
}
