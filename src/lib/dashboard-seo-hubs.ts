/** Dashboard hub routes with server-rendered SEO copy — crawlable without a session. */
export const DASHBOARD_SEO_HUB_PATHS = new Set([
  "/dashboard",
  "/dashboard/analytics",
  "/dashboard/settings",
  "/dashboard/content",
  "/dashboard/geo-audit",
  "/dashboard/discussions",
  "/dashboard/backlinks",
]);

export function isDashboardSeoHubPath(pathname: string): boolean {
  return DASHBOARD_SEO_HUB_PATHS.has(pathname);
}
