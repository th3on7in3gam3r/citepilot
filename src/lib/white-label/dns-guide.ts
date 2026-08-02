/** Client-safe DNS helpers for white-label CNAME setup UI. */

export function reportsCnameTarget(): string {
  return (
    process.env.REPORTS_CNAME_TARGET?.trim() ||
    process.env.NEXT_PUBLIC_REPORTS_CNAME_TARGET?.trim() ||
    "reports.getcitepilot.com"
  );
}

export function normalizeReportDomain(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/\.$/, "");
}

/** Host / Name field for a CNAME at common DNS providers (Cloudflare, GoDaddy, etc.). */
export function cnameDnsHost(customDomain: string): {
  host: string;
  zone: string;
  fullDomain: string;
  isApex: boolean;
} {
  const fullDomain = normalizeReportDomain(customDomain) || "reports.youragency.com";
  const parts = fullDomain.split(".").filter(Boolean);

  if (parts.length <= 2) {
    const zone = fullDomain;
    return { host: "@", zone, fullDomain, isApex: true };
  }

  const zone = parts.slice(-2).join(".");
  const host = parts.slice(0, -2).join(".");
  return { host, zone, fullDomain, isApex: false };
}
