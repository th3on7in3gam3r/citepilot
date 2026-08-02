import { NextResponse } from "next/server";
import { getSharedAudit, verifySharePassword } from "@/lib/audit/share";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

type Params = { params: Promise<{ token: string }> };

export const GET = withApiLogging(async function GET(_request: Request, { params }: Params) {
  const { token } = await params;
  const shared = await getSharedAudit(token);
  if (!shared) {
    return NextResponse.json({ error: "Share link not found" }, { status: 404 });
  }
  if (shared.expired) {
    return NextResponse.json(
      { error: "expired", expired: true, domain: shared.domain },
      { status: 410 },
    );
  }
  if (shared.requiresPassword) {
    return NextResponse.json({
      token: shared.token,
      domain: shared.domain,
      branding: shared.branding,
      createdAt: shared.createdAt,
      expiresAt: shared.expiresAt,
      requiresPassword: true,
    });
  }
  return NextResponse.json(shared);
});

export const POST = withApiLogging(async function POST(request: Request, { params }: Params) {
  const { token } = await params;
  let body: { password?: string };
  try {
    body = (await request.json()) as { password?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const ok = await verifySharePassword(token, body.password ?? "");
  if (!ok) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const shared = await getSharedAudit(token, { skipPasswordGate: true });
  if (!shared || shared.expired) {
    return NextResponse.json({ error: "Share link not found" }, { status: 404 });
  }

  return NextResponse.json(shared);
});
