"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardIcon } from "@/components/dashboard/DashboardIcon";
import type { DashboardNavItem } from "@/lib/dashboard";
import { isDashboardNavActive } from "@/lib/dashboard-nav";

export function DashboardNavLink({
  item,
  active: activeProp,
  onNavigate,
  variant = "drawer",
}: {
  item: DashboardNavItem;
  active?: boolean;
  onNavigate?: () => void;
  variant?: "drawer" | "rail";
}) {
  const pathname = usePathname();
  const active = activeProp ?? isDashboardNavActive(pathname, item.href);

  if (variant === "rail") {
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        data-active={active ? "true" : undefined}
        aria-current={active ? "page" : undefined}
        title={item.description}
        className="dash-sidebar-link group"
      >
        <span className="dash-sidebar-link__icon" aria-hidden>
          <DashboardIcon icon={item.icon} className="h-[17px] w-[17px]" />
        </span>
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
        {item.badge ? (
          <span className="shrink-0 rounded-md bg-accent/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
            {item.badge}
          </span>
        ) : null}
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      title={item.description}
      className={`dash-sidebar-link group ${active ? "dash-sidebar-link--active" : ""}`}
    >
      <span className="dash-sidebar-link__icon" aria-hidden>
        <DashboardIcon icon={item.icon} className="h-[17px] w-[17px]" />
      </span>
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.badge ? (
        <span className="shrink-0 rounded-md bg-accent/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
          {item.badge}
        </span>
      ) : null}
    </Link>
  );
}
