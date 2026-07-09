import { NextResponse } from "next/server";
import {
  getLatestAuditByDomain,
  getRecentAuditsForDomain,
} from "@/lib/audit/run-audit";
import { normalizeDomain } from "@/lib/audit/site-analyzer";
import { publicScorePageUrl } from "@/lib/score/public-score-url";

export const runtime = "nodejs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, X-Api-Key, Content-Type",
};

export async function OPTIONS(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * Partner read API for growth-stack integrations (e.g. AI-CMO SEO Agent).
 * Returns the latest stored citation audit for a domain when one exists.
 */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const rawDomain = url.searchParams.get("domain")?.trim();
  if (!rawDomain) {
    return NextResponse.json(
      { error: "domain query parameter is required" },
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

  const [latest, recent] = await Promise.all([
    getLatestAuditByDomain(domain),
    getRecentAuditsForDomain(domain, 2),
  ]);

  const previous = recent.length > 1 ? recent[1] : null;
  const score = latest?.score ?? null;
  const trend =
    score != null && previous?.score != null ? score - previous.score : null;

  return NextResponse.json(
    {
      domain,
      hasAudit: Boolean(latest),
      score,
      cited: latest?.cited ?? null,
      total: latest?.total ?? null,
      platforms: latest?.platforms ?? [],
      gaps: latest?.gaps?.slice(0, 5) ?? [],
      auditedAt: latest?.createdAt ?? null,
      trend,
      reportUrl: publicScorePageUrl(domain),
      auditUrl: `https://getcitepilot.com/audit?domain=${encodeURIComponent(domain)}`,
    },
    {
      headers: {
        ...CORS_HEADERS,
        "Cache-Control": "public, max-age=300",
      },
    },
  );
}
