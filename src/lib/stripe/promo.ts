import { campaignCode, campaignMessage } from "@/lib/campaign/config";
import { PH_PROMO_CODE } from "@/lib/launch/config";
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

function softValidWithoutStripe(normalized: string): PromoValidation | null {
  if (normalized === PH_PROMO_CODE) {
    return {
      valid: true,
      code: normalized,
      message: `✓ ${PH_PROMO_CODE} applied — 30% off for 3 months`,
    };
  }
  const seasonal = campaignCode();
  if (seasonal && normalized === seasonal) {
    return {
      valid: true,
      code: normalized,
      message: `✓ ${normalized} — ${campaignMessage()}`,
    };
  }
  return null;
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

    const seasonal = campaignCode();
    const label =
      normalized === PH_PROMO_CODE
        ? `✓ ${PH_PROMO_CODE} applied — 30% off for 3 months`
        : seasonal && normalized === seasonal
          ? `✓ ${normalized} — ${campaignMessage()}`
          : `✓ ${normalized} applied`;

    return {
      valid: true,
      code: normalized,
      message: label,
      promotionCodeId,
    };
  } catch (err) {
    console.error("validatePilotPromoCode", err);
    const soft = softValidWithoutStripe(normalized);
    if (soft) return soft;
    return { valid: false, code: normalized, message: "Could not validate promo code" };
  }
}
