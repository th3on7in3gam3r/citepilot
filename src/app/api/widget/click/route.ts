import { trackServerEvent } from "@/lib/analytics/track-server";
import { normalizeDomain } from "@/lib/audit/site-analyzer";
import { refererDomain } from "@/lib/widget/referer";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request): Promise<Response> {
  let body: { domain?: string; action?: string };
  try {
    body = (await request.json()) as { domain?: string; action?: string };
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const domain = body.domain ? normalizeDomain(body.domain) : "";
  if (!domain || !domain.includes(".")) {
    return Response.json({ error: "Invalid domain" }, { status: 400 });
  }

  if (body.action === "click") {
    const referer = request.headers.get("referer");
    const source = refererDomain(referer);
    await trackServerEvent("badge_click", {
      badge_domain: domain,
      referer_domain: source ?? "direct",
      distinctId: source ? `badge:${source}` : "badge:direct",
    });
  }

  return Response.json({ ok: true }, { headers: CORS_HEADERS });
}
