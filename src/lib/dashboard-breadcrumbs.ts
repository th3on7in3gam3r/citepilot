import { dashboardNav } from "@/lib/dashboard";

export type DashboardBreadcrumb = {
  label: string;
  href?: string;
};

export function dashboardBreadcrumbs(pathname: string): DashboardBreadcrumb[] {
  const crumbs: DashboardBreadcrumb[] = [
    { label: "Dashboard", href: "/dashboard" },
  ];

  if (pathname === "/dashboard") {
    crumbs.push({ label: "Overview" });
    return crumbs;
  }

  if (pathname.startsWith("/dashboard/settings")) {
    crumbs.push({ label: "Settings", href: "/dashboard/settings" });
    const tail = pathname.replace("/dashboard/settings", "").replace(/^\//, "");
    if (tail) {
      const labels: Record<string, string> = {
        team: "Team",
        integrations: "Integrations",
        security: "Security",
        "scan-schedule": "Scan schedule",
      };
      crumbs.push({ label: labels[tail] ?? tail });
    }
    return crumbs;
  }

  const match = dashboardNav.find(
    (item) =>
      pathname === item.href ||
      (item.href !== "/dashboard" && pathname.startsWith(item.href)),
  );
  if (match) {
    crumbs.push({ label: match.label });
  } else {
    crumbs.push({ label: "Dashboard" });
  }

  return crumbs;
}
