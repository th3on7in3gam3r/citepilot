export type AnalyticsEvent =
  | "audit_started"
  | "audit_completed"
  | "signup_completed"
  | "workspace_created"
  | "pilot_checkout_started"
  | "fleet_checkout_started"
  | "cms_published"
  | "second_audit_completed";

type TrackProps = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    plausible?: (
      event: string,
      options?: { props?: Record<string, string | number> },
    ) => void;
    posthog?: {
      capture: (event: string, props?: Record<string, unknown>) => void;
    };
  }
}

export function trackAuditCompleted(
  workspaceId: string,
  options?: { isSecond?: boolean },
): void {
  trackEvent(
    options?.isSecond ? "second_audit_completed" : "audit_completed",
    { workspaceId },
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
    window.posthog?.capture(name, props);
  } catch {
    /* ignore */
  }
}
