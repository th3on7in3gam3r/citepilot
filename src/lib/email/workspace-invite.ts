import { sendEmail } from "@/lib/email/send";
import { appBaseUrl } from "@/lib/stripe/config";

function layout(body: string): string {
  return `<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#0f172a;max-width:560px;margin:0 auto;padding:24px">
<p style="margin:0 0 16px"><strong>CitePilot</strong></p>
${body}
<p style="margin:24px 0 0;font-size:13px;color:#64748b">— The CitePilot team</p>
</body></html>`;
}

export async function sendWorkspaceInviteEmail(input: {
  to: string;
  inviterName: string;
  workspaceDomain: string;
  token: string;
}): Promise<void> {
  const acceptUrl = `${appBaseUrl()}/invite/${input.token}`;
  const inviter = input.inviterName.trim() || "A teammate";

  await sendEmail({
    to: input.to,
    subject: `${inviter} invited you to CitePilot workspace: ${input.workspaceDomain}`,
    html: layout(`
<p><strong>${inviter}</strong> invited you to collaborate on <strong>${input.workspaceDomain}</strong>'s citation workspace on CitePilot.</p>
<p><a href="${acceptUrl}" style="display:inline-block;margin-top:8px;padding:12px 20px;background:#0ea5e9;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Accept invite →</a></p>
<p style="font-size:13px;color:#64748b;margin-top:16px">This invite expires in 7 days. If you don't have an account yet, you'll be asked to sign up first.</p>
`),
    text: `${inviter} invited you to collaborate on ${input.workspaceDomain} on CitePilot. Accept: ${acceptUrl} (expires in 7 days)`,
  });
}
