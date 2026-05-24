import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";

export const runtime = "nodejs";

const routes = auth?.handler();

function notConfigured() {
  return NextResponse.json(
    { error: "Neon Auth is not configured (NEON_AUTH_BASE_URL + NEON_AUTH_COOKIE_SECRET)" },
    { status: 503 },
  );
}

export const GET = routes?.GET ?? notConfigured;
export const POST = routes?.POST ?? notConfigured;
