export function stripeSecretKey(): string | null {
  return process.env.STRIPE_SECRET_KEY?.trim() || null;
}

export function stripePublishableKey(): string | null {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() || null;
}

export function stripeWebhookSecret(): string | null {
  return process.env.STRIPE_WEBHOOK_SECRET?.trim() || null;
}

export function stripePilotPriceId(): string | null {
  return process.env.STRIPE_PILOT_PRICE_ID?.trim() || null;
}

export function isStripeConfigured(): boolean {
  return Boolean(stripeSecretKey() && stripePilotPriceId());
}

export function stripeEnvStatus(): { ok: boolean; detail: string } {
  const missing: string[] = [];
  if (!stripeSecretKey()) missing.push("STRIPE_SECRET_KEY");
  if (!stripePublishableKey()) missing.push("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
  if (!stripePilotPriceId()) missing.push("STRIPE_PILOT_PRICE_ID");
  if (missing.length) {
    return { ok: false, detail: `Missing ${missing.join(", ")}` };
  }
  return { ok: true, detail: "Checkout + Pilot price configured" };
}

export function appBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;
  return "http://localhost:3000";
}
