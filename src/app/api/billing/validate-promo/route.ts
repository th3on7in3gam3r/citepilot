import { NextResponse } from "next/server";
import { campaignCode, campaignMessage } from "@/lib/campaign/config";
import { PH_PROMO_CODE } from "@/lib/launch/config";
import { withApiLogging } from "@/lib/observability/api-log";
import { isStripeConfigured } from "@/lib/stripe/config";
import { validatePilotPromoCode } from "@/lib/stripe/promo";

export const runtime = "nodejs";

/** GET /api/billing/validate-promo?code=PRODUCTHUNT30 */
export const GET = withApiLogging(async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code")?.trim();
  if (!code) {
    return NextResponse.json({ valid: false, message: "Missing code" }, { status: 400 });
  }

  if (!isStripeConfigured()) {
    const upper = code.toUpperCase();
    const seasonal = campaignCode();
    if (upper === PH_PROMO_CODE) {
      return NextResponse.json({
        valid: true,
        code: upper,
        message: `✓ ${PH_PROMO_CODE} applied — 30% off for 3 months`,
      });
    }
    if (seasonal && upper === seasonal) {
      return NextResponse.json({
        valid: true,
        code: upper,
        message: `✓ ${upper} — ${campaignMessage()}`,
      });
    }
    return NextResponse.json({
      valid: false,
      code: upper,
      message: "Stripe not configured",
    });
  }

  const result = await validatePilotPromoCode(code);
  return NextResponse.json(result);
});
