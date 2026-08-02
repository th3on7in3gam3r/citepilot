import { sendEmail } from "@/lib/email/send";
import { dashboardUrl } from "@/lib/email/config";

function layout(body: string): string {
  return `<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#0f172a;max-width:560px;margin:0 auto;padding:24px">
<p style="margin:0 0 16px"><strong>CitePilot</strong></p>
${body}
<p style="margin:24px 0 0;font-size:13px;color:#64748b">— The CitePilot team</p>
</body></html>`;
}

export async function sendReferralSignupEmail(input: {
  to: string;
}): Promise<void> {
  const settingsUrl = `${dashboardUrl()}/settings`;
  await sendEmail({
    to: input.to,
    subject: "Someone used your CitePilot referral link",
    html: layout(`
<p>Good news — someone just signed up for CitePilot using your referral link.</p>
<p>You'll earn <strong>1 month free</strong> on your next billing cycle when they upgrade to Pilot or Fleet (up to 6 months total).</p>
<p><a href="${settingsUrl}" style="color:#0ea5e9">View your referral stats →</a></p>
`),
    text: `Someone signed up via your CitePilot referral link. You'll earn 1 month free when they upgrade. Stats: ${settingsUrl}`,
  });
}

export async function sendReferralConvertedEmail(input: {
  to: string;
}): Promise<void> {
  const settingsUrl = `${dashboardUrl()}/settings`;
  await sendEmail({
    to: input.to,
    subject: "You earned 1 free month — referral credit applied",
    html: layout(`
<p>Your referral just upgraded to a paid CitePilot plan.</p>
<p><strong>You earned 1 free month!</strong> We've applied a credit to your Stripe account — it will reduce your next invoice.</p>
<p><a href="${settingsUrl}" style="color:#0ea5e9">View referral credits →</a></p>
`),
    text: `You earned 1 free month from a CitePilot referral. Credit applied to your next invoice. ${settingsUrl}`,
  });
}
