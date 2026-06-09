"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardIcon } from "@/components/dashboard/DashboardIcon";
import { dashboardNav } from "@/lib/dashboard";
import { isDashboardNavActive } from "@/lib/dashboard-nav";

export function DashboardRail() {
  const pathname = usePathname();
  const items = dashboardNav.filter((item) => item.section !== "footer");
  const footer = dashboardNav.filter((item) => item.section === "footer");

  return (
    <aside className="flex h-[100dvh] w-[72px] shrink-0 flex-col items-center bg-[#0c1512] py-5">
      <Link
        href="/dashboard"
        className="mb-8 flex h-11 w-11 items-center justify-center rounded-xl transition hover:opacity-90"
        aria-label="CitePilot dashboard"
      >
        <Image
          src="/logo-mark.svg"
          alt="CitePilot"
          width={44}
          height={44}
          className="h-11 w-11"
          priority
        />
      </Link>

      <nav className="flex flex-1 flex-col items-center gap-2">
        {items.map((item) => {
          const active = isDashboardNavActive(pathname, item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              title={item.label}
              className={`flex h-11 w-11 items-center justify-center rounded-xl transition ${
                active
                  ? "bg-white/10 text-[#0ea5e9]"
                  : "text-[#94a3b8] hover:bg-white/5 hover:text-white"
              }`}
            >
              <DashboardIcon icon={item.icon} className="h-5 w-5" />
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col items-center gap-2">
        {footer.map((item) => {
          const active = isDashboardNavActive(pathname, item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              title={item.label}
              className={`flex h-11 w-11 items-center justify-center rounded-xl transition ${
                active
                  ? "bg-white/10 text-[#0ea5e9]"
                  : "text-[#94a3b8] hover:bg-white/5 hover:text-white"
              }`}
            >
              <DashboardIcon icon={item.icon} className="h-5 w-5" />
            </Link>
          );
        })}
        <div
          className="mt-2 h-9 w-9 rounded-full bg-gradient-to-br from-[#6b8cff] to-[#0ea5e9]"
          title="Account"
        />
      </div>
    </aside>
  );
}
