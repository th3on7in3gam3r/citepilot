import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/constants";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

export const POST = withApiLogging(async function POST(request: Request) {
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) {
    return NextResponse.json(
      { error: "ADMIN_SECRET is not configured on the server" },
      { status: 503 },
    );
  }

  const body = (await request.json()) as { secret?: string };
  if (body.secret !== adminSecret) {
    return NextResponse.json({ error: "Invalid admin secret" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, adminSecret, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
});

export const DELETE = withApiLogging(async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(ADMIN_COOKIE);
  return response;
});
