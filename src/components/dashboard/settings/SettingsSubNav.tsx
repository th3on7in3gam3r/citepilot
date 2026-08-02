"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/dashboard/settings", label: "General", match: (path: string) => path === "/dashboard/settings" },
  {
    href: "/dashboard/settings/team",
    label: "Team",
    match: (path: string) => path.startsWith("/dashboard/settings/team"),
  },
  {
    href: "/dashboard/settings/integrations",
    label: "Integrations",
    match: (path: string) => path.startsWith("/dashboard/settings/integrations"),
  },
  {
    href: "/dashboard/settings/security",
    label: "Security",
    match: (path: string) => path.startsWith("/dashboard/settings/security"),
  },
  {
    href: "/dashboard/settings/scan-schedule",
    label: "Scan schedule",
    match: (path: string) => path.startsWith("/dashboard/settings/scan-schedule"),
  },
  {
    href: "/dashboard/settings#notifications",
    label: "Notifications",
    match: (path: string) => false,
  },
] as const;

export function SettingsSubNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav
      aria-label="Settings sections"
      className="mb-6 flex flex-wrap gap-1 border-b border-[var(--dashboard-sidebar-border)]"
    >
      {tabs.map((tab) => {
        const active = tab.match(pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`-mb-px border-b-2 px-3 py-2.5 text-sm font-medium transition ${
              active
                ? "border-accent text-ink"
                : "border-transparent text-muted hover:border-[var(--dashboard-sidebar-border)] hover:text-ink"
            }`}
            aria-current={active ? "page" : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
