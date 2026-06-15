import { Resend } from "resend";
import { isLocalDevelopment } from "@/lib/env/runtime";
import {
  emailFromAddress,
  emailFromMisconfigurationWarning,
  emailFromParts,
  emailFromUsesPlaceholderFallback,
  isEmailConfigured,
  resendApiKey,
  resendTestFromAddress,
} from "@/lib/email/config";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  fromName?: string;
  replyTo?: string;
  /** Retry with onboarding@resend.dev when the primary domain is unverified (test sends). */
  allowTestFromFallback?: boolean;
};

export type SendEmailResult = {
  ok: boolean;
  error?: string;
  id?: string;
  usedTestFrom?: boolean;
  correctedFrom?: boolean;
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
    const configured = emailFromParts();
    const warning = emailFromMisconfigurationWarning();
    if (warning) return warning;
    return (
      `Resend rejected the send: "${configured.email}" is not verified. ` +
      `Add and verify ${configured.domain} at resend.com/domains, update EMAIL_FROM in Vercel if needed, then redeploy. ` +
      `Details: ${message}`
    );
  }
  return message;
}

function applyFromName(baseFrom: string, fromName?: string): string {
  if (!fromName?.trim()) return baseFrom;
  const match = baseFrom.match(/<([^>]+)>/);
  const email = match?.[1]?.trim() ?? baseFrom.trim();
  return `${fromName.trim()} <${email}>`;
}

async function sendViaResend(
  input: SendEmailInput,
  from: string,
): Promise<{ ok: boolean; error?: string; rawError?: string; id?: string }> {
  const resend = new Resend(resendApiKey()!);
  const fromHeader = applyFromName(from, input.fromName);
  const replyTo =
    input.replyTo?.trim() && isValidRecipientEmail(input.replyTo)
      ? input.replyTo.trim()
      : undefined;
  try {
    const { data, error } = await resend.emails.send({
      from: fromHeader,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo,
    });

    if (error) {
      const raw = error.message ?? JSON.stringify(error);
      console.error("[email] Resend error", { from: fromHeader, to: input.to, raw });
      return { ok: false, rawError: raw, error: formatResendError(raw) };
    }
    return { ok: true, id: data?.id };
  } catch (err) {
    const raw = err instanceof Error ? err.message : "Resend request failed";
    console.error("[email] Resend exception", { from: fromHeader, to: input.to, raw });
    return { ok: false, rawError: raw, error: formatResendError(raw) };
  }
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  if (!isEmailConfigured()) {
    console.warn("Email skipped — RESEND_API_KEY not set");
    return { ok: false, error: "Email not configured" };
  }

  const correctedFrom = emailFromUsesPlaceholderFallback();
  const primaryFrom = emailFromAddress();
  const primary = await sendViaResend(input, primaryFrom);
  if (primary.ok) {
    return { ...primary, correctedFrom: correctedFrom || undefined };
  }

  const shouldRetryWithTestFrom =
    primary.rawError &&
    isDomainVerificationError(primary.rawError) &&
    (input.allowTestFromFallback ||
      process.env.RESEND_USE_TEST_FROM === "1" ||
      isLocalDevelopment());

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
  const fallback = await sendViaResend(input, testFrom);
  if (fallback.ok) {
    return { ...fallback, usedTestFrom: true };
  }
  return fallback;
}

/** Basic RFC-style check — Resend validates further. */
export function isValidRecipientEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
