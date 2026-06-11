"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardIcon } from "@/components/dashboard/DashboardIcon";
import { authClient } from "@/lib/auth/client";
import { dashboardNav } from "@/lib/dashboard";
import { isDashboardNavActive } from "@/lib/dashboard-nav";

export function DashboardRail() {
  const pathname = usePathname();
  const items = dashboardNav.filter((item) => item.section !== "footer");
  const footer = dashboardNav.filter((item) => item.section === "footer");
  const [initial, setInitial] = useState<string | null>(null);

  useEffect(() => {
    authClient.getSession().then(({ data }) => {
      if (data?.user) {
        const name = data.user.name || "";
        const email = data.user.email || "";
        const letter = name.trim() ? name[0] : email.trim() ? email[0] : "";
        if (letter) {
          setInitial(letter.toUpperCase());
        }
      }
    });
  }, []);

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
        <Link
          href="/dashboard/settings"
          className="mt-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#162a22] text-[#10b981] border border-[#10b981]/25 hover:border-[#10b981]/50 hover:bg-[#1f3a30] transition-all duration-200 shadow-[0_2px_6px_rgba(0,0,0,0.2)]"
          title="Account settings"
        >
          {initial ? (
            <span className="font-display text-xs font-bold tracking-wider">{initial}</span>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          )}
        </Link>
      </div>
    </aside>
  );
}
