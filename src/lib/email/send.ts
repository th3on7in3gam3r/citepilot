import { Resend } from "resend";
import { isLocalDevelopment } from "@/lib/env/runtime";
import {
  emailFromAddress,
  isEmailConfigured,
  resendApiKey,
  resendTestFromAddress,
} from "@/lib/email/config";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

const DOMAIN_VERIFY_PATTERNS = [
  /domain is not verified/i,
  /verify your domain/i,
  /not authorized to send/i,
];

const TEST_RECIPIENT_PATTERN =
  /only send testing emails to your own email address \(([^)]+)\)/i;

function isDomainVerificationError(message: string): boolean {
  return DOMAIN_VERIFY_PATTERNS.some((p) => p.test(message));
}

export function formatResendError(message: string): string {
  const allowedRecipient = message.match(TEST_RECIPIENT_PATTERN)?.[1];
  if (allowedRecipient) {
    return `Until your sending domain is verified in Resend, test emails can only go to ${allowedRecipient}. Verify getcitepilot.com at resend.com/domains, or use that address for "Send test digest".`;
  }
  if (isDomainVerificationError(message)) {
    return `Resend rejected the send: your EMAIL_FROM domain is not verified yet. Add and verify the domain at resend.com/domains (Dashboard → Domains), then retry. Details: ${message}`;
  }
  return message;
}

async function sendViaResend(
  input: SendEmailInput,
  from: string,
): Promise<{ ok: boolean; error?: string; rawError?: string; id?: string }> {
  const resend = new Resend(resendApiKey()!);
  try {
    const { data, error } = await resend.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });

    if (error) {
      const raw = error.message ?? JSON.stringify(error);
      console.error("[email] Resend error", { from, to: input.to, raw });
      return { ok: false, rawError: raw, error: formatResendError(raw) };
    }
    return { ok: true, id: data?.id };
  } catch (err) {
    const raw = err instanceof Error ? err.message : "Resend request failed";
    console.error("[email] Resend exception", { from, to: input.to, raw });
    return { ok: false, rawError: raw, error: formatResendError(raw) };
  }
}

export async function sendEmail(
  input: SendEmailInput,
): Promise<{ ok: boolean; error?: string; id?: string }> {
  if (!isEmailConfigured()) {
    console.warn("Email skipped — RESEND_API_KEY not set");
    return { ok: false, error: "Email not configured" };
  }

  const primaryFrom = emailFromAddress();
  const primary = await sendViaResend(input, primaryFrom);
  if (primary.ok) return primary;

  const shouldRetryWithTestFrom =
    isLocalDevelopment() &&
    primary.rawError &&
    (isDomainVerificationError(primary.rawError) ||
      process.env.RESEND_USE_TEST_FROM === "1");

  if (!shouldRetryWithTestFrom) {
    return primary;
  }

  const testFrom = resendTestFromAddress();
  if (testFrom === primaryFrom) {
    return primary;
  }

  console.warn(
    `[email] Retrying with Resend test sender (${testFrom}) — verify EMAIL_FROM domain for production.`,
  );
  return sendViaResend(input, testFrom);
}

/** Basic RFC-style check — Resend validates further. */
export function isValidRecipientEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
