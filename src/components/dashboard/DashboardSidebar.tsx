"use client";

import { usePathname } from "next/navigation";
import { DashboardNavLink } from "@/components/dashboard/DashboardNavLink";
import { WorkspaceSwitcher } from "@/components/dashboard/WorkspaceSwitcher";
import { Logo } from "@/components/ui/Logo";
import { dashboardNav } from "@/lib/dashboard";
import { isDashboardNavActive } from "@/lib/dashboard-nav";

export function DashboardSidebar() {
  const pathname = usePathname();
  const main = dashboardNav.filter((item) => item.section !== "footer");
  const footer = dashboardNav.filter((item) => item.section === "footer");

  return (
    <aside className="sticky top-0 flex h-[100dvh] w-64 shrink-0 flex-col border-r border-border bg-white">
      <div className="shrink-0 border-b border-border px-4 py-4">
        <Logo className="mb-3 text-base" />
        <WorkspaceSwitcher />
      </div>
      <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        {main.map((item) => (
          <DashboardNavLink
            key={item.id}
            item={item}
            active={isDashboardNavActive(pathname, item.href)}
          />
        ))}
      </nav>
      <div className="shrink-0 border-t border-border px-3 py-4">
        {footer.map((item) => (
          <DashboardNavLink
            key={item.id}
            item={item}
            active={isDashboardNavActive(pathname, item.href)}
          />
        ))}
      </div>
    </aside>
  );
}
