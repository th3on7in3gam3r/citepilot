import { NextResponse } from "next/server";
import { validatePilotPromoCode } from "@/lib/stripe/promo";
import { isStripeConfigured } from "@/lib/stripe/config";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

/** GET /api/billing/validate-promo?code=PRODUCTHUNT30 */
export const GET = withApiLogging(async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code")?.trim();
  if (!code) {
    return NextResponse.json({ valid: false, message: "Missing code" }, { status: 400 });
  }

  if (!isStripeConfigured()) {
    return NextResponse.json({
      valid: code.toUpperCase() === "PRODUCTHUNT30",
      code: code.toUpperCase(),
      message:
        code.toUpperCase() === "PRODUCTHUNT30"
          ? "✓ PRODUCTHUNT30 applied — 30% off for 3 months"
          : "Stripe not configured",
    });
  }

  const result = await validatePilotPromoCode(code);
  return NextResponse.json(result);
});
