import { appBaseUrl } from "@/lib/stripe/config";
import { isLocalDevelopment } from "@/lib/env/runtime";

export const DEFAULT_EMAIL_FROM = "CitePilot <alerts@getcitepilot.com>";
const TEST_FROM = "CitePilot <onboarding@resend.dev>";

const PLACEHOLDER_FROM_DOMAINS = new Set([
  "yourverifieddomain.com",
  "yourdomain.com",
  "example.com",
  "example.org",
  "changeme.com",
]);

export function parseEmailFromAddress(from: string): {
  displayName: string | null;
  email: string;
  domain: string;
} {
  const trimmed = from.trim();
  const bracketMatch = trimmed.match(/^(.+?)\s*<([^>]+)>$/);
  const email = (bracketMatch?.[2] ?? trimmed).trim().toLowerCase();
  const domain = email.split("@")[1] ?? "";
  return {
    displayName: bracketMatch?.[1]?.trim() || null,
    email,
    domain,
  };
}

/** Raw EMAIL_FROM from env — no placeholder substitution. */
export function rawEmailFromAddress(): string {
  if (process.env.RESEND_USE_TEST_FROM === "1") {
    return resendTestFromAddress();
  }
  return process.env.EMAIL_FROM?.trim() || DEFAULT_EMAIL_FROM;
}

export function emailFromUsesPlaceholderFallback(): boolean {
  if (process.env.RESEND_USE_TEST_FROM === "1") return false;
  const raw = process.env.EMAIL_FROM?.trim();
  if (!raw) return false;
  return isPlaceholderEmailFromDomain(parseEmailFromAddress(raw).domain);
}

export function emailFromParts(): ReturnType<typeof parseEmailFromAddress> {
  return parseEmailFromAddress(emailFromAddress());
}

export function isPlaceholderEmailFromDomain(domain: string): boolean {
  const normalized = domain.trim().toLowerCase();
  if (!normalized) return true;
  return PLACEHOLDER_FROM_DOMAINS.has(normalized);
}

/** Non-blocking warning when env still uses a Resend docs placeholder. */
export function emailFromMisconfigurationWarning(): string | null {
  if (!emailFromUsesPlaceholderFallback()) return null;
  const raw = parseEmailFromAddress(process.env.EMAIL_FROM!.trim());
  return (
    `EMAIL_FROM is "${raw.email}" (Resend placeholder). Sends use alerts@getcitepilot.com instead. ` +
    `Set EMAIL_FROM=CitePilot <alerts@getcitepilot.com> in Vercel → Environment Variables and redeploy.`
  );
}

/** @deprecated use emailFromMisconfigurationWarning */
export function emailFromMisconfigurationError(): string | null {
  return emailFromMisconfigurationWarning();
}

export function resendTestFromAddress(): string {
  return process.env.RESEND_TEST_FROM?.trim() || TEST_FROM;
}

/** Resolved sender — substitutes verified getcitepilot.com when env uses a placeholder domain. */
export function emailFromAddress(): string {
  if (process.env.RESEND_USE_TEST_FROM === "1") {
    return resendTestFromAddress();
  }

  const raw = process.env.EMAIL_FROM?.trim();
  if (!raw) return DEFAULT_EMAIL_FROM;

  const parts = parseEmailFromAddress(raw);
  if (!isPlaceholderEmailFromDomain(parts.domain)) return raw;

  const defaultParts = parseEmailFromAddress(DEFAULT_EMAIL_FROM);
  const displayName = parts.displayName ?? defaultParts.displayName ?? "CitePilot";
  console.warn(
    `[email] EMAIL_FROM uses placeholder domain "${parts.domain}"; sending as ${displayName} <${defaultParts.email}>`,
  );
  return `${displayName} <${defaultParts.email}>`;
}

export function emailFromHint(): string | null {
  if (isLocalDevelopment() && process.env.RESEND_USE_TEST_FROM !== "1") {
    return "Local dev: if sends fail, verify EMAIL_FROM in Resend or set RESEND_USE_TEST_FROM=1 to use onboarding@resend.dev (Resend account email only until domain is verified).";
  }
  return null;
}

export function resendApiKey(): string | null {
  return process.env.RESEND_API_KEY?.trim() || null;
}

export function cronSecret(): string | null {
  return process.env.CRON_SECRET?.trim() || null;
}

export function isEmailConfigured(): boolean {
  return Boolean(resendApiKey());
}

export function dashboardUrl(path = "/dashboard"): string {
  return `${appBaseUrl()}${path}`;
}
