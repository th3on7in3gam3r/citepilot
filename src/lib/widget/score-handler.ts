import { getLatestAuditByDomain } from "@/lib/audit/run-audit";
import { normalizeDomain } from "@/lib/audit/site-analyzer";
import { trackServerEvent } from "@/lib/analytics/track-server";
import {
  parseBadgeStyle,
  renderGeoBadgeSvg,
  widgetPlatformSummary,
  type BadgeScoreData,
} from "@/lib/widget/geo-badge";
import { isOwnSiteReferer, refererDomain } from "@/lib/widget/referer";

export const BADGE_CACHE_MAX_AGE = 86400;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

export async function handleWidgetScoreOptions(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

function badgeDataFromAudit(domain: string): Promise<BadgeScoreData> {
  return getLatestAuditByDomain(domain).then((audit) => {
    if (!audit) {
      return {
        domain,
        score: null,
        hasAudit: false,
        platforms: [],
      };
    }
    return {
      domain: audit.domain,
      score: audit.score,
      hasAudit: true,
      platforms: audit.platforms.map((p) => ({
        name: p.name,
        present: p.present,
      })),
    };
  });
}

async function logBadgeImpression(
  request: Request,
  badgeDomain: string,
): Promise<void> {
  const referer = request.headers.get("referer");
  if (isOwnSiteReferer(referer)) return;

  const source = refererDomain(referer);
  await trackServerEvent("badge_impression", {
    badge_domain: badgeDomain,
    referer_domain: source ?? "direct",
    distinctId: source ? `badge:${source}` : "badge:direct",
  });
}

export async function handleWidgetScoreRequest(
  request: Request,
  rawDomain: string,
): Promise<Response> {
  const domain = normalizeDomain(decodeURIComponent(rawDomain));
  if (!domain || !domain.includes(".")) {
    return new Response("Invalid domain", { status: 400 });
  }

  const url = new URL(request.url);
  const format = url.searchParams.get("format");
  const style = parseBadgeStyle(url.searchParams.get("style"));

  const data = await badgeDataFromAudit(domain);

  void logBadgeImpression(request, domain);

  const cacheHeaders = {
    "Cache-Control": `public, max-age=${BADGE_CACHE_MAX_AGE}`,
  };

  if (format === "json") {
    const platformLimit = Math.min(
      8,
      Math.max(1, Number.parseInt(url.searchParams.get("platforms") ?? "2", 10) || 2),
    );
    return Response.json(
      {
        domain: data.domain,
        score: data.score,
        hasAudit: data.hasAudit,
        platforms: widgetPlatformSummary(data.platforms, platformLimit),
      },
      { headers: { ...cacheHeaders, ...CORS_HEADERS } },
    );
  }

  const svg = renderGeoBadgeSvg(data, style);
  return new Response(svg, {
    headers: {
      ...cacheHeaders,
      ...CORS_HEADERS,
      "Content-Type": "image/svg+xml; charset=utf-8",
    },
  });
}
