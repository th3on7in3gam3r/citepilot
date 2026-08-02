import { getLatestAuditByDomain } from "@/lib/audit/run-audit";
import { normalizeDomain } from "@/lib/audit/site-analyzer";
import { isDomainScorePublic } from "@/lib/score/domain-profiles";
import { auditToScoreOgData } from "@/lib/score/public-score";
import { renderAuditOgImage } from "@/lib/og/audit-card";

export const runtime = "nodejs";
export const revalidate = 604800;

type Params = { params: Promise<{ domain: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { domain: rawDomain } = await params;
  const domain = normalizeDomain(decodeURIComponent(rawDomain));
  if (!domain) {
    return new Response("Invalid domain", { status: 400 });
  }

  const isPublic = await isDomainScorePublic(domain);
  if (!isPublic) {
    return new Response("Not found", { status: 404 });
  }

  const audit = await getLatestAuditByDomain(domain);
  if (!audit) {
    return new Response("Not found", { status: 404 });
  }

  const image = await renderAuditOgImage(auditToScoreOgData(audit));

  image.headers.set(
    "Cache-Control",
    "public, max-age=604800, stale-while-revalidate=86400",
  );

  return image;
}
