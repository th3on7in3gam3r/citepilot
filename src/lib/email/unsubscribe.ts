import { createHmac, timingSafeEqual } from "crypto";
import { appBaseUrl } from "@/lib/stripe/config";

function unsubscribeSecret(): string {
  return (
    process.env.EMAIL_UNSUBSCRIBE_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    "citepilot-dev-unsubscribe"
  );
}

function signPayload(payload: string): string {
  return createHmac("sha256", unsubscribeSecret()).update(payload).digest("base64url");
}

function verifySignedPayload(payload: string, token: string): boolean {
  const expected = signPayload(payload);
  try {
    const a = Buffer.from(token);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function createUnsubscribeToken(userId: string): string {
  return signPayload(`user:${userId}`);
}

export function verifyUnsubscribeToken(userId: string, token: string): boolean {
  return verifySignedPayload(`user:${userId}`, token);
}

export function unsubscribeUrl(userId: string): string {
  const token = createUnsubscribeToken(userId);
  return `${appBaseUrl()}/api/email/unsubscribe?uid=${encodeURIComponent(userId)}&token=${encodeURIComponent(token)}`;
}

export function createDigestUnsubscribeToken(workspaceId: string): string {
  return signPayload(`digest:${workspaceId}`);
}

export function verifyDigestUnsubscribeToken(workspaceId: string, token: string): boolean {
  return verifySignedPayload(`digest:${workspaceId}`, token);
}

export function digestUnsubscribeUrl(workspaceId: string): string {
  const token = createDigestUnsubscribeToken(workspaceId);
  return `${appBaseUrl()}/api/email/unsubscribe-digest?ws=${encodeURIComponent(workspaceId)}&token=${encodeURIComponent(token)}`;
}
