"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/dashboard/settings", label: "General", match: (path: string) => path === "/dashboard/settings" },
  {
    href: "/dashboard/settings/integrations",
    label: "Integrations",
    match: (path: string) => path.startsWith("/dashboard/settings/integrations"),
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
      className="mb-6 flex flex-wrap gap-2 border-b border-border pb-4"
    >
      {tabs.map((tab) => {
        const active = tab.match(pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              active
                ? "bg-ink text-white"
                : "border border-border bg-card text-ink hover:bg-surface"
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
