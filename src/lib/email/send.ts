import { Resend } from "resend";
import { emailFromAddress, isEmailConfigured, resendApiKey } from "@/lib/email/config";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail(
  input: SendEmailInput,
): Promise<{ ok: boolean; error?: string }> {
  if (!isEmailConfigured()) {
    console.warn("Email skipped — RESEND_API_KEY not set");
    return { ok: false, error: "Email not configured" };
  }

  const resend = new Resend(resendApiKey()!);
  const { error } = await resend.emails.send({
    from: emailFromAddress(),
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });

  if (error) {
    console.error("Resend error", error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
