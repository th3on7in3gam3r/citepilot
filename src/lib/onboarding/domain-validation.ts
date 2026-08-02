import { normalizeDomain } from "@/lib/audit/site-analyzer";

/** Basic hostname validation (no protocol/path). */
const DOMAIN_RE =
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

export type DomainFormatStatus = "empty" | "invalid" | "valid";

export function domainFormatStatus(input: string): DomainFormatStatus {
  const clean = normalizeDomain(input);
  if (!clean) return "empty";
  if (!DOMAIN_RE.test(clean)) return "invalid";
  return "valid";
}

export function cleanDomainInput(input: string): string {
  return normalizeDomain(input);
}
