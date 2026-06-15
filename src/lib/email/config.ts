import { appBaseUrl } from "@/lib/stripe/config";
import { isLocalDevelopment } from "@/lib/env/runtime";

export function resendApiKey(): string | null {
  return process.env.RESEND_API_KEY?.trim() || null;
}

const DEFAULT_FROM = "CitePilot <alerts@getcitepilot.com>";
const TEST_FROM = "CitePilot <onboarding@resend.dev>";

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
