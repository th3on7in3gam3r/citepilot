import { NextResponse } from "next/server";
import { subscribeToNewsletter } from "@/lib/email/subscribe";
import { addWaitlistEmail } from "@/lib/server/workspace";
import { withApiLogging } from "@/lib/observability/api-log";

export const POST = withApiLogging(async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    try {
      await addWaitlistEmail(email);
    } catch {
      /* duplicate ok */
    }

    const subscribed = await subscribeToNewsletter(email);
    if (!subscribed.ok) {
      return NextResponse.json(
        { error: subscribed.error ?? "Newsletter subscribe failed" },
        { status: 503 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/tools/geo-playbook/subscribe", error);
    return NextResponse.json({ error: "Subscribe failed" }, { status: 500 });
  }
});
