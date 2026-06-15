import { appBaseUrl } from "@/lib/stripe/config";
import { isLocalDevelopment } from "@/lib/env/runtime";

export function resendApiKey(): string | null {
  return process.env.RESEND_API_KEY?.trim() || null;
}

const DEFAULT_FROM = "CitePilot <alerts@getcitepilot.com>";
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

export function emailFromParts(): ReturnType<typeof parseEmailFromAddress> {
  return parseEmailFromAddress(emailFromAddress());
}

export function isPlaceholderEmailFromDomain(domain: string): boolean {
  const normalized = domain.trim().toLowerCase();
  if (!normalized) return true;
  return PLACEHOLDER_FROM_DOMAINS.has(normalized);
}

/** Actionable error when EMAIL_FROM was never configured beyond Resend docs placeholders. */
export function emailFromMisconfigurationError(): string | null {
  const parts = emailFromParts();
  if (!isPlaceholderEmailFromDomain(parts.domain)) return null;
  return (
    `Server EMAIL_FROM uses "${parts.email}" — that is a Resend documentation placeholder, not a verified domain. ` +
    `Set EMAIL_FROM to CitePilot <alerts@getcitepilot.com> (or your verified sender) in Vercel → Settings → Environment Variables, ` +
    `verify the domain at resend.com/domains, then redeploy.`
  );
}

export function resendTestFromAddress(): string {
  return process.env.RESEND_TEST_FROM?.trim() || TEST_FROM;
}

export function emailFromAddress(): string {
  if (process.env.RESEND_USE_TEST_FROM === "1") {
    return resendTestFromAddress();
  }
  return process.env.EMAIL_FROM?.trim() || DEFAULT_FROM;
}

export function emailFromHint(): string | null {
  if (isLocalDevelopment() && process.env.RESEND_USE_TEST_FROM !== "1") {
    return "Local dev: if sends fail, verify EMAIL_FROM in Resend or set RESEND_USE_TEST_FROM=1 to use onboarding@resend.dev (Resend account email only until domain is verified).";
  }
  return null;
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
