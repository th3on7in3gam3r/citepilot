import { PH_PROMO_CODE, PH_PROMO_LABEL } from "@/lib/launch/config";
import { getStripe } from "@/lib/stripe/server";

export type PromoValidation = {
  valid: boolean;
  code: string;
  message: string;
  promotionCodeId?: string;
};

/** Look up an active Stripe promotion code by customer-facing code string. */
export async function lookupStripePromotionCode(
  code: string,
): Promise<string | null> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;

  const stripe = getStripe();
  const list = await stripe.promotionCodes.list({
    code: normalized,
    active: true,
    limit: 1,
  });
  return list.data[0]?.id ?? null;
}

export async function validatePilotPromoCode(code: string): Promise<PromoValidation> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) {
    return { valid: false, code: normalized, message: "Enter a promo code" };
  }

  try {
    const promotionCodeId = await lookupStripePromotionCode(normalized);
    if (!promotionCodeId) {
      return { valid: false, code: normalized, message: "Invalid or expired promo code" };
    }

    const label =
      normalized === PH_PROMO_CODE
        ? `✓ ${PH_PROMO_CODE} applied — 30% off for 3 months`
        : `✓ ${normalized} applied — ${PH_PROMO_LABEL}`;

    return {
      valid: true,
      code: normalized,
      message: label,
      promotionCodeId,
    };
  } catch (err) {
    console.error("validatePilotPromoCode", err);
    return { valid: false, code: normalized, message: "Could not validate promo code" };
  }
}
