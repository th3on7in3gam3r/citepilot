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
  | "autopilot_run"
  | "citation_checker_started"
  | "citation_checker_completed"
  | "referral_link_clicked"
  | "referral_signup_completed"
  | "referral_converted_to_paid"
  | "referral_credit_applied"
  | "referral_share_clicked"
  | "upgrade_prompt_viewed"
  | "upgrade_prompt_clicked"
  | "feature_gate_viewed"
  | "usage_limit_warning_shown"
  | "upgrade_cta_clicked"
  | "checkout_started"
  | "checkout_completed"
  | "upgrade_modal_shown"
  | "upgrade_modal_clicked"
  | "upgrade_modal_dismissed"
  | "badge_impression"
  | "badge_click"
  | "badge_referral_signup"
  | "tool_used"
  | "tool_result_viewed"
  | "tool_upgrade_cta_clicked"
  | "proof_report_viewed"
  | "proof_report_cta_clicked"
  | "score_page_cta_clicked"
  | "proof_report_share_clicked"
  | "audit_share_created"
  | "audit_feedback_submitted"
  | "cancel_survey_submitted"
  | "feature_request_submitted"
  | "hero_cta_clicked"
  | "first_scan_completed";

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
