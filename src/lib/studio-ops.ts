import crypto from "crypto";

export const STUDIO_OPS_PRODUCT = "citepilot" as const;

export type StudioOpsEventType =
  | "user.signup"
  | "workspace.created"
  | "subscription.upgraded"
  | "subscription.canceled"
  | "bundle.activated"
  | "bundle.updated"
  | "bundle.canceled";

function studioOpsUrl(): string | null {
  const raw = process.env.STUDIO_OPS_URL?.trim();
  if (!raw) return null;
  return raw.replace(/\/+$/, "");
}

function studioOpsSecret(): string | null {
  return (
    process.env.STUDIO_OPS_WEBHOOK_SECRET?.trim() ||
    process.env.STUDIO_OPS_SECRET?.trim() ||
    null
  );
}

export function isStudioOpsConfigured(): boolean {
  return Boolean(studioOpsUrl() && studioOpsSecret());
}

function signBody(body: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

function splitPayload(payload: Record<string, unknown>): {
  email: string | null;
  externalUserId: string | null;
  metadata: Record<string, unknown>;
} {
  const { email, userId, externalUserId, ...rest } = payload;
  return {
    email: typeof email === "string" ? email : email == null ? null : String(email),
    externalUserId:
      typeof externalUserId === "string"
        ? externalUserId
        : typeof userId === "string"
          ? userId
          : userId == null
            ? null
            : String(userId),
    metadata: rest,
  };
}

/** Fire-and-forget Studio Ops fan-out (no-op when env unset). */
export function emitStudioOpsEvent(
  type: StudioOpsEventType,
  payload: Record<string, unknown> = {},
): void {
  void emitStudioOpsEventAsync(type, payload).catch((err) => {
    console.warn("[studio-ops] emit failed", type, err);
  });
}

export async function emitStudioOpsEventAsync(
  type: StudioOpsEventType,
  payload: Record<string, unknown> = {},
): Promise<void> {
  const baseUrl = studioOpsUrl();
  const secret = studioOpsSecret();
  if (!baseUrl || !secret) return;

  const { email, externalUserId, metadata } = splitPayload(payload);

  const body = JSON.stringify({
    product: STUDIO_OPS_PRODUCT,
    event: type,
    email,
    externalUserId,
    metadata,
  });

  const signature = signBody(body, secret);

  const res = await fetch(`${baseUrl}/api/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Studio-Ops-Signature": signature,
    },
    body,
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Studio Ops ${res.status}: ${text.slice(0, 200)}`);
  }
}
