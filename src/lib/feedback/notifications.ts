import { isEmailConfigured } from "@/lib/email/config";
import { sendEmail } from "@/lib/email/send";
import { opsReportRecipient } from "@/lib/email/ops-report";
import type { CancelSurveyReason } from "@/lib/feedback/store";
import type { FeatureRequestStatus } from "@/lib/feedback/store";
import { appBaseUrl } from "@/lib/stripe/config";

const STATUS_LABELS: Record<FeatureRequestStatus, string> = {
  under_review: "Under Review",
  planned: "Planned",
  in_progress: "In Progress",
  shipped: "Shipped",
};

const CANCEL_REASON_LABELS: Record<CancelSurveyReason, string> = {
  too_expensive: "Too expensive",
  not_enough_value: "Not getting enough value",
  switching_competitor: "Switching to a competitor",
  just_testing: "Just testing — will come back",
  missing_feature: "Missing a feature I need",
  technical_issues: "Technical issues",
};

export async function notifyFeatureRequestStatusChange(input: {
  to: string;
  title: string;
  status: FeatureRequestStatus;
}): Promise<void> {
  if (!isEmailConfigured() || !input.to) return;

  const label = STATUS_LABELS[input.status];
  const subject = `Your feature request update: ${input.title}`;
  const html = `
    <p>Hi there,</p>
    <p>Your CitePilot feature request <strong>${escapeHtml(input.title)}</strong> is now marked as <strong>${label}</strong>.</p>
    <p><a href="${appBaseUrl()}/feedback">View the roadmap →</a></p>
    <p style="color:#64748b;font-size:14px">Thanks for helping shape CitePilot.</p>
  `;
  const text = `Your feature request "${input.title}" is now: ${label}. View: ${appBaseUrl()}/feedback`;

  await sendEmail({ to: input.to, subject, html, text });
}

export async function notifyOpsCancelSurvey(input: {
  userId: string;
  userEmail?: string | null;
  reason: CancelSurveyReason;
  competitor?: string | null;
  missingFeature?: string | null;
  details?: string | null;
  plan?: string | null;
}): Promise<void> {
  const to = opsReportRecipient();
  if (!isEmailConfigured() || !to) return;

  const reasonLabel = CANCEL_REASON_LABELS[input.reason];
  const lines = [
    `User: ${input.userEmail ?? input.userId}`,
    `Plan: ${input.plan ?? "unknown"}`,
    `Reason: ${reasonLabel}`,
  ];
  if (input.competitor) lines.push(`Competitor: ${input.competitor}`);
  if (input.missingFeature) lines.push(`Missing feature: ${input.missingFeature}`);
  if (input.details) lines.push(`Details: ${input.details}`);

  const body = lines.join("\n");
  await sendEmail({
    to,
    subject: `[CitePilot] Subscription cancel survey — ${reasonLabel}`,
    html: `<pre style="font-family:system-ui;white-space:pre-wrap">${escapeHtml(body)}</pre>`,
    text: body,
  });
}

function escapeHtml(value: string): string {
  return value.replace(/[<>&"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}
