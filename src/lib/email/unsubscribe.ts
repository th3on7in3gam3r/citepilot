import { createHmac, timingSafeEqual } from "crypto";
import { appBaseUrl } from "@/lib/stripe/config";

function unsubscribeSecret(): string {
  return (
    process.env.EMAIL_UNSUBSCRIBE_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    "citepilot-dev-unsubscribe"
  );
}

export function createUnsubscribeToken(userId: string): string {
  return createHmac("sha256", unsubscribeSecret())
    .update(userId)
    .digest("base64url");
}

export function verifyUnsubscribeToken(userId: string, token: string): boolean {
  const expected = createUnsubscribeToken(userId);
  try {
    const a = Buffer.from(token);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function unsubscribeUrl(userId: string): string {
  const token = createUnsubscribeToken(userId);
  return `${appBaseUrl()}/api/email/unsubscribe?uid=${encodeURIComponent(userId)}&token=${encodeURIComponent(token)}`;
}
