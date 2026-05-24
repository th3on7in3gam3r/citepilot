import { NextResponse } from "next/server";
import { addWaitlistEmail } from "@/lib/server/workspace";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    try {
      const result = await addWaitlistEmail(email);
      return NextResponse.json(result);
    } catch {
      return NextResponse.json({ ok: true, id: "existing" });
    }
  } catch (error) {
    console.error("POST /api/waitlist", error);
    return NextResponse.json({ error: "Failed to join waitlist" }, { status: 500 });
  }
}
