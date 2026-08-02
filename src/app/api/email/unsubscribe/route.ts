import { NextResponse } from "next/server";
import { resolveUserEmail } from "@/lib/email/recipient";
import { recordUnsubscribe } from "@/lib/email/sequences/store";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe";
import { withApiLogging } from "@/lib/observability/api-log";

export const GET = withApiLogging(async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("uid")?.trim();
  const token = searchParams.get("token")?.trim();

  if (!userId || !token || !verifyUnsubscribeToken(userId, token)) {
    return new NextResponse(
      `<!DOCTYPE html><html><body style="font-family:system-ui;padding:40px;text-align:center"><h1>Invalid link</h1><p>This unsubscribe link is invalid or expired.</p></body></html>`,
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }

  const email = (await resolveUserEmail(userId)) ?? "unknown";
  await recordUnsubscribe(userId, email);

  return new NextResponse(
    `<!DOCTYPE html><html><body style="font-family:system-ui;padding:40px;text-align:center;max-width:480px;margin:0 auto"><h1>You're unsubscribed</h1><p>You won't receive marketing emails from CitePilot. Transactional alerts you configure in Settings (audit complete, score drops) may still send if enabled.</p></body></html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
});
