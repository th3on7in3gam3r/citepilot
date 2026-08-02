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

export function stripeFleetPriceId(): string | null {
  return process.env.STRIPE_FLEET_PRICE_ID?.trim() || null;
}

export function stripePilotAnnualPriceId(): string | null {
  return process.env.STRIPE_PILOT_ANNUAL_PRICE_ID?.trim() || null;
}

export function stripeFleetAnnualPriceId(): string | null {
  return process.env.STRIPE_FLEET_ANNUAL_PRICE_ID?.trim() || null;
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
  const fleet = stripeFleetPriceId();
  return {
    ok: true,
    detail: fleet
      ? "Checkout + Pilot & Fleet prices configured"
      : "Checkout + Pilot price configured (add STRIPE_FLEET_PRICE_ID for Fleet)",
  };
}

export function appBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;
  const render = process.env.RENDER_EXTERNAL_URL?.trim();
  if (render) return render.replace(/\/$/, "");
  return "http://localhost:3000";
}
