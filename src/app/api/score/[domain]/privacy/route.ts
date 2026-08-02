import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server";
import { setDomainScoreVisibility } from "@/lib/score/domain-profiles";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ domain: string }> };

export const PATCH = withApiLogging(async function PATCH(request: Request, ctx: Ctx) {
  const session = await getSessionUser(request);
  if (!session) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { domain } = await ctx.params;
  const body = (await request.json()) as { isPublic?: boolean };
  if (typeof body.isPublic !== "boolean") {
    return NextResponse.json({ error: "isPublic required" }, { status: 400 });
  }

  const result = await setDomainScoreVisibility(domain, body.isPublic, session.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }

  return NextResponse.json({ ok: true, isPublic: body.isPublic });
});
