import type { AuditPayload } from "@/lib/api-types";
import { getLatestAuditByDomain } from "@/lib/audit/run-audit";
import { normalizeDomain } from "@/lib/audit/site-analyzer";
import type { AuditOgData } from "@/lib/audit/share";
import {
  getDomainScoreProfile,
  isDomainScorePublic,
  type DomainScoreProfile,
} from "@/lib/score/domain-profiles";
import { PUBLIC_SCORE_PLATFORMS } from "@/lib/score/platforms";
import { getRelatedScoreDomains, type RelatedDomain } from "@/lib/score/related-domains";

export type PublicScorePageData = {
  domain: string;
  audit: AuditPayload;
  profile: DomainScoreProfile | null;
  platforms: { name: string; present: boolean }[];
  relatedDomains: RelatedDomain[];
};

export async function getPublicScorePageData(
  rawDomain: string,
): Promise<PublicScorePageData | null> {
  const domain = normalizeDomain(decodeURIComponent(rawDomain));
  if (!domain || !domain.includes(".")) return null;

  const isPublic = await isDomainScorePublic(domain);
  if (!isPublic) return null;

  const audit = await getLatestAuditByDomain(domain);
  if (!audit) return null;

  const profile = await getDomainScoreProfile(domain);
  const platforms = PUBLIC_SCORE_PLATFORMS.map((name) => ({
    name,
    present: audit.platforms.find((p) => p.name === name)?.present ?? false,
  }));

  const relatedDomains = await getRelatedScoreDomains(domain).catch(() => []);

  return { domain, audit, profile, platforms, relatedDomains };
}

export function auditToScoreOgData(audit: AuditPayload): AuditOgData {
  const platforms = PUBLIC_SCORE_PLATFORMS.map((name) => ({
    name,
    present: audit.platforms.find((p) => p.name === name)?.present ?? false,
  }));

  return {
    domain: audit.domain,
    score: audit.score,
    platforms,
    citedPrompts: audit.cited,
    totalPrompts: audit.total,
  };
}
