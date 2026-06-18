#!/usr/bin/env node
/**
 * Create Stripe coupon + promotion code for Product Hunt launch.
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_... STRIPE_PILOT_PRICE_ID=price_... node scripts/create-ph-coupon.mjs
 *
 * Optional:
 *   PH_LAUNCH_DATE=2026-06-03  (coupon expires 7 days after this date)
 */
import Stripe from "stripe";

const COUPON_ID = "PRODUCTHUNT30";
const PROMO_CODE = "PRODUCTHUNT30";
const DISCOUNT_PERCENT = 30;
const DURATION_MONTHS = 3;
const MAX_REDEMPTIONS = 30;

function launchExpiryUnix(): number {
  const raw = process.env.PH_LAUNCH_DATE?.trim();
  const base = raw ? new Date(raw) : new Date();
  if (Number.isNaN(base.getTime())) {
    throw new Error(`Invalid PH_LAUNCH_DATE: ${raw}`);
  }
  base.setUTCDate(base.getUTCDate() + 7);
  return Math.floor(base.getTime() / 1000);
}

async function main() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  const pilotPriceId = process.env.STRIPE_PILOT_PRICE_ID?.trim();
  if (!key) throw new Error("STRIPE_SECRET_KEY is required");
  if (!pilotPriceId) throw new Error("STRIPE_PILOT_PRICE_ID is required");

  const stripe = new Stripe(key);
  const expiresAt = launchExpiryUnix();

  let coupon;
  try {
    coupon = await stripe.coupons.retrieve(COUPON_ID);
    console.log(`Coupon ${COUPON_ID} already exists (${coupon.percent_off}% off)`);
  } catch {
    coupon = await stripe.coupons.create({
      id: COUPON_ID,
      percent_off: DISCOUNT_PERCENT,
      duration: "repeating",
      duration_in_months: DURATION_MONTHS,
      max_redemptions: MAX_REDEMPTIONS,
      redeem_by: expiresAt,
      name: "Product Hunt — 30% off Pilot (3 months)",
      metadata: { campaign: "ph_launch_2026", plan: "pilot_monthly" },
    });
    console.log(`Created coupon ${coupon.id}`);
  }

  const existing = await stripe.promotionCodes.list({ code: PROMO_CODE, limit: 1 });
  if (existing.data[0]) {
    console.log(`Promotion code ${PROMO_CODE} already exists: ${existing.data[0].id}`);
    return;
  }

  const promo = await stripe.promotionCodes.create({
    coupon: coupon.id,
    code: PROMO_CODE,
    max_redemptions: MAX_REDEMPTIONS,
    expires_at: expiresAt,
    restrictions: {
      minimum_amount: undefined,
    },
    metadata: { campaign: "ph_launch_2026" },
  });

  console.log(`Created promotion code ${promo.code} → ${promo.id}`);
  console.log(`Expires: ${new Date(expiresAt * 1000).toISOString()}`);
  console.log(`Restrict to Pilot monthly price ${pilotPriceId} in Stripe Dashboard if needed.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
