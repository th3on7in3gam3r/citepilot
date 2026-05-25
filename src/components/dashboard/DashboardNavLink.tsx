"use client";

import Link from "next/link";
import { DashboardIcon } from "@/components/dashboard/DashboardIcon";
import type { DashboardNavItem } from "@/lib/dashboard";

export function DashboardNavLink({
  item,
  active,
  onNavigate,
}: {
  item: DashboardNavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
        active
          ? "bg-accent/10 text-accent"
          : "text-muted hover:bg-surface hover:text-ink"
      }`}
    >
      <DashboardIcon icon={item.icon} className="h-[18px] w-[18px] shrink-0" />
      {item.label}
    </Link>
  );
}
