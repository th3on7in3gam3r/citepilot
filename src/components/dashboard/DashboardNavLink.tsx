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
        className="dash-sidebar-link"
      >
        <DashboardIcon icon={item.icon} className="h-[18px] w-[18px] shrink-0" />
        <span className="truncate">{item.label}</span>
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
        active
          ? "bg-white text-accent shadow-sm dark:bg-surface"
          : "text-muted hover:bg-surface hover:text-ink"
      }`}
    >
      <DashboardIcon icon={item.icon} className="h-[18px] w-[18px] shrink-0" />
      {item.label}
    </Link>
  );
}
