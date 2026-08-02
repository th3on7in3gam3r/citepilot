import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { generateURI } from "otplib";
import { getRealSessionUser } from "@/lib/auth/server";
import { withApiLogging } from "@/lib/observability/api-log";
import { formatTotpSecretForDisplay } from "@/lib/security/totp-codes";
import { beginTotpSetup } from "@/lib/security/totp-store";
import { site } from "@/lib/site";

export const runtime = "nodejs";

export const POST = withApiLogging(async function POST(request: Request) {
  const session = await getRealSessionUser(request);
  if (!session?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { secret } = await beginTotpSetup(session.id);
  const label = session.email || session.name || session.id;
  const uri = generateURI({
    issuer: site.name,
    label,
    secret,
  });
  const qrCodeDataUrl = await QRCode.toDataURL(uri);

  return NextResponse.json({
    qrCodeDataUrl,
    manualKey: formatTotpSecretForDisplay(secret),
  });
});
