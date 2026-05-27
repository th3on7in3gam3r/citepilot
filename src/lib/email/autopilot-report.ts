import type { AuditPayload } from "@/lib/api-types";
import type { ScanDeltaSummary } from "@/lib/audit/scan-delta";
import { createAuditShare } from "@/lib/audit/share";
import { scanDeltaSummaryHtml } from "@/lib/email/notifications";
import { dashboardUrl } from "@/lib/email/config";
import { sendEmail } from "@/lib/email/send";
import { appBaseUrl } from "@/lib/stripe/config";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendAutopilotReportEmail(input: {
  domain: string;
  to: string;
  audit: AuditPayload;
  workspaceId: string;
  userId: string | null;
  scanDelta: ScanDeltaSummary;
  insightText: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const proofUrl = `${appBaseUrl()}/report/proof`;
  const overviewUrl = dashboardUrl("/dashboard");

  const share = await createAuditShare({
    auditId: input.audit.id,
    workspaceId: input.workspaceId,
    userId: input.userId,
  });

  const shareBlock =
    "url" in share
      ? `<p><strong>Client share link:</strong><br/><a href="${share.url}">${share.url}</a></p>`
      : "";

  const insightBlock = input.insightText
    ? `<h2 style="font-size:16px;margin-top:24px">Your 7-day plan</h2>
<div style="white-space:pre-wrap;font-size:14px;line-height:1.6">${escapeHtml(input.insightText)}</div>`
    : `<p style="margin-top:16px">Open the dashboard for your latest gaps and actions.</p>`;

  const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;max-width:560px;margin:0 auto;padding:24px">
<h1 style="font-size:20px;margin:0 0 8px">CitePilot Autopilot — ${escapeHtml(input.domain)}</h1>
<p style="color:#666;margin:0 0 20px">Weekly scan complete · score <strong>${input.audit.score}/100</strong> · ${input.audit.cited}/${input.audit.total} prompts cited</p>
${scanDeltaSummaryHtml(input.scanDelta)}
${insightBlock}
<p style="margin-top:24px"><a href="${proofUrl}"><strong>Open proof report</strong></a> · <a href="${overviewUrl}">Dashboard</a></p>
${shareBlock}
<p style="margin-top:32px;font-size:12px;color:#666">Autopilot never publishes to your CMS — review and publish from Content when ready.</p>
</body></html>`;

  const textParts = [
    `CitePilot Autopilot — ${input.domain}`,
    `Score: ${input.audit.score}/100`,
    input.scanDelta.chips.length
      ? `Changes: ${input.scanDelta.chips.join(", ")}`
      : "No major scan changes",
    input.insightText ? `\nPlan:\n${input.insightText}` : "",
    `\nProof: ${proofUrl}`,
  ];

  return sendEmail({
    to: input.to,
    subject: `CitePilot Autopilot — ${input.domain} (${input.audit.score}/100)`,
    html,
    text: textParts.join("\n"),
  });
}
