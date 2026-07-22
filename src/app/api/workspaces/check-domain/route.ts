import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { normalizeDomain } from "@/lib/audit/site-analyzer";
import { neonDbErrorDetail } from "@/lib/db";
import { workspaceDomainTaken } from "@/lib/server/workspace-management";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

export const POST = withApiLogging(async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (auth instanceof NextResponse) return auth;
  const userId = apiUserId(auth);
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  let body: { domain?: string; excludeWorkspaceId?: string };
  try {
    body = (await request.json()) as { domain?: string; excludeWorkspaceId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const domain = body.domain?.trim();
  if (!domain) {
    return NextResponse.json({ error: "domain is required" }, { status: 400 });
  }

  try {
    normalizeDomain(domain);
  } catch {
    return NextResponse.json({ error: "Invalid domain" }, { status: 400 });
  }

  try {
    const taken = await workspaceDomainTaken(
      userId,
      domain,
      body.excludeWorkspaceId?.trim(),
    );

    return NextResponse.json({
      available: !taken,
      domain: normalizeDomain(domain),
    });
  } catch (error) {
    console.error(
      "POST /api/workspaces/check-domain",
      neonDbErrorDetail(error),
    );
    return NextResponse.json(
      { error: "Could not check domain availability. Try again in a moment." },
      { status: 503 },
    );
  }
});
