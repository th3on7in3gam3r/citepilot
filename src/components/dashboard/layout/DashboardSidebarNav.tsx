"use client";

import { DashboardNavLink } from "@/components/dashboard/DashboardNavLink";
import { dashboardNav, dashboardNavGroups } from "@/lib/dashboard";
import { isDashboardNavActive } from "@/lib/dashboard-nav";
import { usePathname } from "next/navigation";

export function DashboardSidebarNav({
  onNavigate,
  className = "",
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();
  const navById = Object.fromEntries(dashboardNav.map((item) => [item.id, item]));

  return (
    <nav className={className} aria-label="Dashboard">
      {dashboardNavGroups.map((group) => {
        const items = group.itemIds
          .map((id) => navById[id])
          .filter((item): item is NonNullable<typeof item> => Boolean(item));

        if (items.length === 0) return null;

        return (
          <div key={group.label} className="dash-nav-group">
            <p className="dash-nav-group__label">{group.label}</p>
            <ul className="mt-1 space-y-0.5">
              {items.map((item) => (
                <li key={item.id}>
                  <DashboardNavLink
                    item={item}
                    variant="rail"
                    active={isDashboardNavActive(pathname, item.href)}
                    onNavigate={onNavigate}
                  />
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
