"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardIcon } from "@/components/dashboard/DashboardIcon";
import { WorkspaceSwitcher } from "@/components/dashboard/WorkspaceSwitcher";
import { Logo } from "@/components/ui/Logo";
import { dashboardNav } from "@/lib/dashboard";

function NavLink({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: (typeof dashboardNav)[number]["icon"];
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
        active
          ? "bg-accent/10 text-accent"
          : "text-muted hover:bg-surface hover:text-ink"
      }`}
    >
      <DashboardIcon icon={icon} className="h-[18px] w-[18px] shrink-0" />
      {label}
    </Link>
  );
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const main = dashboardNav.filter((item) => item.section !== "footer");
  const footer = dashboardNav.filter((item) => item.section === "footer");

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <aside className="sticky top-0 flex h-[100dvh] w-64 shrink-0 flex-col border-r border-border bg-white">
      <div className="shrink-0 border-b border-border px-4 py-4">
        <Logo className="mb-3 text-base" />
        <WorkspaceSwitcher />
      </div>
      <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        {main.map((item) => (
          <NavLink
            key={item.id}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={isActive(item.href)}
          />
        ))}
      </nav>
      <div className="shrink-0 border-t border-border px-3 py-4">
        {footer.map((item) => (
          <NavLink
            key={item.id}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={isActive(item.href)}
          />
        ))}
      </div>
    </aside>
  );
}
