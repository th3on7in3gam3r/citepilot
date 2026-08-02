/** Extract hostname from Referer header (external embed source). */
export function refererDomain(referer: string | null): string | null {
  if (!referer?.trim()) return null;
  try {
    const host = new URL(referer).hostname.toLowerCase();
    if (!host || host === "localhost" || host.endsWith(".local")) return host || null;
    return host.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function isOwnSiteReferer(referer: string | null): boolean {
  const domain = refererDomain(referer);
  if (!domain) return false;
  return (
    domain === "getcitepilot.com" ||
    domain === "citepilot.com" ||
    domain.endsWith(".getcitepilot.com") ||
    domain.endsWith(".vercel.app")
  );
}
