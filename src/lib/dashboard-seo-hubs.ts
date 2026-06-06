/** Dashboard hub routes with server-rendered SEO copy — crawlable without a session. */
export const DASHBOARD_SEO_HUB_PATHS = [
  "/dashboard",
  "/dashboard/analytics",
  "/dashboard/settings",
  "/dashboard/content",
  "/dashboard/geo-audit",
  "/dashboard/discussions",
  "/dashboard/backlinks",
] as const;

const DASHBOARD_SEO_HUB_PATH_SET = new Set<string>(DASHBOARD_SEO_HUB_PATHS);

export function isDashboardSeoHubPath(pathname: string): boolean {
  return DASHBOARD_SEO_HUB_PATH_SET.has(pathname);
}
