import { NextResponse } from "next/server";
import { updateEmailEventByResendId } from "@/lib/email/sequences/store";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

type ResendWebhookEvent = {
  type?: string;
  data?: {
    email_id?: string;
    click?: { link?: string };
  };
};

/** POST /api/webhooks/resend — track opens/clicks for sequence emails. */
export const POST = withApiLogging(async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET?.trim();
  if (secret) {
    const signature = request.headers.get("svix-signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }
    // Full Svix verification can be added when RESEND_WEBHOOK_SECRET is set in production.
  }

  const event = (await request.json()) as ResendWebhookEvent;
  const emailId = event.data?.email_id;
  if (!emailId) {
    return NextResponse.json({ received: true });
  }

  if (event.type === "email.opened") {
    await updateEmailEventByResendId(emailId, "opened_at");
  } else if (event.type === "email.clicked") {
    await updateEmailEventByResendId(emailId, "clicked_at");
  }

  return NextResponse.json({ received: true });
});
