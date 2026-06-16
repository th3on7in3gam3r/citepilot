import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server";
import {
  getOrCreateVerificationToken,
  markDomainClaimed,
} from "@/lib/score/domain-profiles";
import { verifyDnsTxtRecord, verifyMetaTag } from "@/lib/score/verification";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ domain: string }> };

export const POST = withApiLogging(async function POST(request: Request, ctx: Ctx) {
  const session = await getSessionUser(request);
  if (!session) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { domain } = await ctx.params;
  const body = (await request.json()) as { method?: "dns" | "meta" };
  const method = body.method === "meta" ? "meta" : "dns";

  const token = await getOrCreateVerificationToken(domain);
  if (!token) {
    return NextResponse.json({ error: "Invalid domain" }, { status: 400 });
  }

  const verified =
    method === "meta"
      ? await verifyMetaTag(domain, token)
      : await verifyDnsTxtRecord(domain, token);

  if (!verified) {
    return NextResponse.json(
      { verified: false, error: "Verification record not found" },
      { status: 400 },
    );
  }

  await markDomainClaimed(domain, session.id);
  return NextResponse.json({ verified: true });
});
