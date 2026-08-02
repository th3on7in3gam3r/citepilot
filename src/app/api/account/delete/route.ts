import { NextResponse } from "next/server";
import {
  requestAccountDeletion,
  verifyDeleteIdentity,
} from "@/lib/account/deletion";
import { auth, getRealSessionUser } from "@/lib/auth/server";
import {
  TOTP_CHALLENGE_COOKIE,
  TOTP_VERIFIED_COOKIE,
  WORKSPACE_COOKIE,
} from "@/lib/constants";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

export const POST = withApiLogging(async function POST(request: Request) {
  const session = await getRealSessionUser(request);
  if (!session?.id || !session.email) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    confirm?: string;
    password?: string;
    totpToken?: string;
  } | null;

  if (body?.confirm !== "DELETE") {
    return NextResponse.json({ error: 'Type DELETE to confirm' }, { status: 400 });
  }

  const identity = await verifyDeleteIdentity({
    userId: session.id,
    email: session.email,
    password: body.password,
    totpToken: body.totpToken,
  });
  if ("error" in identity) {
    return NextResponse.json({ error: identity.error }, { status: 400 });
  }

  const result = await requestAccountDeletion({
    userId: session.id,
    email: session.email,
  });
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  if (auth) {
    await auth.signOut();
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(WORKSPACE_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(TOTP_VERIFIED_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(TOTP_CHALLENGE_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
});
