import { appBaseUrl } from "@/lib/stripe/config";

export function resendApiKey(): string | null {
  return process.env.RESEND_API_KEY?.trim() || null;
}

export function emailFromAddress(): string {
  return (
    process.env.EMAIL_FROM?.trim() || "CitePilot <alerts@getcitepilot.com>"
  );
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
