/** Fleet agency overview → single-workspace dashboard drill-down. */
export function fleetWorkspaceDashboardHref(workspaceId: string): string {
  return `/dashboard?site=${encodeURIComponent(workspaceId)}`;
}

export function isFleetWorkspaceDashboardView(
  isFleet: boolean,
  siteId: string | null,
): boolean {
  return isFleet && Boolean(siteId?.trim());
}
