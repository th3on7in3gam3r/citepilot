#!/usr/bin/env node
/**
 * Create Stripe coupon + promotion code for seasonal GEO campaign (GEO2026).
 *
 * Usage (loads from env; do not paste secrets into chat):
 *   set -a && source .env.local && set +a
 *   node scripts/create-geo-campaign-coupon.mjs
 *
 * Optional overrides:
 *   CAMPAIGN_CODE=GEO2026
 *   CAMPAIGN_DISCOUNT_PERCENT=30
 *   CAMPAIGN_DISCOUNT_MONTHS=3
 *   CAMPAIGN_MAX_REDEMPTIONS=100
 *   CAMPAIGN_ENDS_AT=2026-08-31T23:59:59.000Z
 */
import Stripe from "stripe";

const PROMO_CODE = (process.env.CAMPAIGN_CODE?.trim() || "GEO2026").toUpperCase();
const COUPON_ID = `COUPON_${PROMO_CODE}`;
const DISCOUNT_PERCENT = Number(process.env.CAMPAIGN_DISCOUNT_PERCENT || "30");
const DURATION_MONTHS = Number(process.env.CAMPAIGN_DISCOUNT_MONTHS || "3");
const MAX_REDEMPTIONS = Number(process.env.CAMPAIGN_MAX_REDEMPTIONS || "100");

function endsAtUnix() {
  const raw =
    process.env.CAMPAIGN_ENDS_AT?.trim() || "2026-08-31T23:59:59.000Z";
  const ends = new Date(raw);
  if (Number.isNaN(ends.getTime())) {
    throw new Error(`Invalid CAMPAIGN_ENDS_AT: ${raw}`);
  }
  return Math.floor(ends.getTime() / 1000);
}

async function main() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  const pilotPriceId = process.env.STRIPE_PILOT_PRICE_ID?.trim();
  if (!key) throw new Error("STRIPE_SECRET_KEY is required");
  if (!pilotPriceId) throw new Error("STRIPE_PILOT_PRICE_ID is required");
  if (!Number.isFinite(DISCOUNT_PERCENT) || DISCOUNT_PERCENT <= 0) {
    throw new Error("CAMPAIGN_DISCOUNT_PERCENT must be a positive number");
  }
  if (!Number.isFinite(DURATION_MONTHS) || DURATION_MONTHS < 1) {
    throw new Error("CAMPAIGN_DISCOUNT_MONTHS must be >= 1");
  }

  const stripe = new Stripe(key);
  const expiresAt = endsAtUnix();
  const name = `GEO campaign — ${DISCOUNT_PERCENT}% off Pilot (${DURATION_MONTHS} mo)`;

  let coupon;
  try {
    coupon = await stripe.coupons.retrieve(COUPON_ID);
    console.log(
      `Coupon ${COUPON_ID} already exists (${coupon.percent_off}% off)`,
    );
  } catch {
    coupon = await stripe.coupons.create({
      id: COUPON_ID,
      percent_off: DISCOUNT_PERCENT,
      duration: "repeating",
      duration_in_months: DURATION_MONTHS,
      max_redemptions: MAX_REDEMPTIONS,
      redeem_by: expiresAt,
      name,
      metadata: {
        campaign: "geo_seasonal_2026",
        plan: "pilot_monthly",
        code: PROMO_CODE,
      },
    });
    console.log(`Created coupon ${coupon.id}`);
  }

  const existing = await stripe.promotionCodes.list({
    code: PROMO_CODE,
    limit: 1,
  });
  if (existing.data[0]) {
    const promo = existing.data[0];
    console.log(`Promotion code ${PROMO_CODE} already exists: ${promo.id}`);
    console.log(`  active: ${promo.active}`);
    console.log(
      `  expires: ${
        promo.expires_at
          ? new Date(promo.expires_at * 1000).toISOString()
          : "(none)"
      }`,
    );
    return;
  }

  // Stripe API 2026-05-27.dahlia+: promotion codes take `promotion`, not `coupon`.
  const promo = await stripe.promotionCodes.create({
    promotion: { type: "coupon", coupon: coupon.id },
    code: PROMO_CODE,
    max_redemptions: MAX_REDEMPTIONS,
    expires_at: expiresAt,
    metadata: {
      campaign: "geo_seasonal_2026",
      pilot_price_id: pilotPriceId,
    },
  });

  console.log(`Created promotion code ${promo.code} → ${promo.id}`);
  console.log(`Expires: ${new Date(expiresAt * 1000).toISOString()}`);
  console.log(
    `Offer: ${DISCOUNT_PERCENT}% off Pilot monthly for ${DURATION_MONTHS} months (max ${MAX_REDEMPTIONS} redemptions)`,
  );
  console.log(
    `Optional: in Stripe Dashboard, restrict coupon to Pilot monthly price ${pilotPriceId}.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
