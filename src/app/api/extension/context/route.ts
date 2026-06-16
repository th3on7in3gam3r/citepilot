import { NextResponse } from "next/server";
import { optionalApiUser } from "@/lib/auth/api";
import { getLatestAuditByDomain } from "@/lib/audit/run-audit";
import { normalizeDomain } from "@/lib/audit/site-analyzer";
import { isPaidPlan } from "@/lib/billing/types";
import { getBillingByUserId } from "@/lib/billing/store";
import { promptsFromPreferences } from "@/lib/audit/resolve-prompts";
import { listWorkspacesForUser, toSnapshot } from "@/lib/server/workspace";
import { widgetPlatformSummary } from "@/lib/widget/geo-badge";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

export const OPTIONS = withApiLogging(async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
});

export const GET = withApiLogging(async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawDomain = searchParams.get("domain")?.trim();
  if (!rawDomain) {
    return NextResponse.json(
      { error: "domain query param required" },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const domain = normalizeDomain(rawDomain);
  if (!domain || !domain.includes(".")) {
    return NextResponse.json(
      { error: "Invalid domain" },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const { userId } = await optionalApiUser(request);
  const audit = await getLatestAuditByDomain(domain);

  const platforms = audit
    ? widgetPlatformSummary(
        audit.platforms.map((p) => ({ name: p.name, present: p.present })),
        4,
      )
    : widgetPlatformSummary([], 4);

  let workspace: {
    id: string;
    domain: string;
    citationScore: number;
    prompts: string[];
    hasRealAudit: boolean;
  } | null = null;

  if (userId) {
    const workspaces = await listWorkspacesForUser(userId);
    const match = workspaces.find(
      (w) => normalizeDomain(w.domain) === domain,
    );
    if (match) {
      const snapshot = toSnapshot(match);
      workspace = {
        id: match.id,
        domain: match.domain,
        citationScore: snapshot.citationScore,
        prompts: promptsFromPreferences(
          match.preferences ?? {},
          match.buyerQuestion,
        ).slice(0, 5),
        hasRealAudit: snapshot.hasRealAudit,
      };
    }
  }

  const billing = userId ? await getBillingByUserId(userId) : null;

  return NextResponse.json(
    {
      signedIn: Boolean(userId),
      isPaid: isPaidPlan(billing),
      domain,
      score: audit?.score ?? null,
      hasAudit: Boolean(audit),
      cited: platforms.some((p) => p.cited),
      platforms,
      workspace,
    },
    {
      headers: {
        ...CORS_HEADERS,
        "Cache-Control": "private, max-age=300",
      },
    },
  );
});
