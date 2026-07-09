import crypto from "crypto";
import { randomUUID } from "crypto";

export const STUDIO_OPS_PRODUCT = "citepilot" as const;

export type StudioOpsEventType =
  | "user.signup"
  | "workspace.created"
  | "subscription.upgraded"
  | "subscription.canceled"
  | "bundle.activated"
  | "bundle.updated"
  | "bundle.canceled";

export type StudioOpsEvent = {
  id: string;
  type: StudioOpsEventType;
  product: typeof STUDIO_OPS_PRODUCT;
  occurredAt: string;
  payload: Record<string, unknown>;
};

function studioOpsUrl(): string | null {
  return process.env.STUDIO_OPS_URL?.trim() || null;
}

function studioOpsSecret(): string | null {
  return (
    process.env.STUDIO_OPS_SECRET?.trim() ||
    process.env.STUDIO_OPS_WEBHOOK_SECRET?.trim() ||
    null
  );
}

export function isStudioOpsConfigured(): boolean {
  return Boolean(studioOpsUrl() && studioOpsSecret());
}

function signBody(body: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

/** Fire-and-forget Studio Ops fan-out (no-op when STUDIO_OPS_URL is unset). */
export function emitStudioOpsEvent(
  type: StudioOpsEventType,
  payload: Record<string, unknown>,
): void {
  void emitStudioOpsEventAsync(type, payload).catch((err) => {
    console.warn("[studio-ops] emit failed", type, err);
  });
}

export async function emitStudioOpsEventAsync(
  type: StudioOpsEventType,
  payload: Record<string, unknown>,
): Promise<void> {
  const url = studioOpsUrl();
  const secret = studioOpsSecret();
  if (!url || !secret) return;

  const event: StudioOpsEvent = {
    id: randomUUID(),
    type,
    product: STUDIO_OPS_PRODUCT,
    occurredAt: new Date().toISOString(),
    payload,
  };

  const body = JSON.stringify(event);
  const signature = signBody(body, secret);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-studio-ops-signature": signature,
      "x-studio-ops-product": STUDIO_OPS_PRODUCT,
    },
    body,
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Studio Ops ${res.status}: ${text.slice(0, 200)}`);
  }
}
