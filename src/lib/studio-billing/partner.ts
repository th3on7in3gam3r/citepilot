import crypto from "crypto";

export type StudioBillingEventType =
  | "bundle.activated"
  | "bundle.updated"
  | "bundle.canceled";

export interface StudioBillingPartnerEvent {
  id: string;
  type: StudioBillingEventType;
  bundleId: string;
  supabaseUserId: string;
  email: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  products: string[];
  entitlements: Record<string, unknown>;
  linkedIds: {
    clerkId?: string | null;
    citepilotUserId?: string | null;
    kerygmaUserId?: string | null;
    aegisGithubLogin?: string | null;
  };
  occurredAt: string;
}

function fanoutSecret(): string | null {
  return process.env.STUDIO_BILLING_FANOUT_SECRET?.trim() || null;
}

export function verifyStudioBillingSignature(
  body: string,
  signature: string | null,
): boolean {
  const secret = fanoutSecret();
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "utf8"),
      Buffer.from(signature, "utf8"),
    );
  } catch {
    return false;
  }
}

export async function resolveCitePilotUserId(
  event: StudioBillingPartnerEvent,
): Promise<string | null> {
  if (event.linkedIds.citepilotUserId) return event.linkedIds.citepilotUserId;
  const { dbGet } = await import("@/lib/db");
  const row = await dbGet<{ user_id: string }>(
    `SELECT user_id FROM user_referrals WHERE LOWER(email) = LOWER(?) LIMIT 1`,
    [event.email],
  );
  return row?.user_id ?? null;
}
