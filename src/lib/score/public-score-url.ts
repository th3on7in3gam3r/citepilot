import { normalizeDomain } from "@/lib/audit/site-analyzer";
import { site } from "@/lib/site";

/** Canonical public SEO score page URL for a domain. */
export function publicScorePageUrl(domain: string): string {
  const normalized = normalizeDomain(domain);
  const base = site.url.replace(/\/$/, "");
  return `${base}/score/${encodeURIComponent(normalized)}`;
}
