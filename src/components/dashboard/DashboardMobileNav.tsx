"use client";

import { useEffect, useState } from "react";
import { effectInit } from "@/lib/react/effect-init";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { DashboardNavLink } from "@/components/dashboard/DashboardNavLink";
import { WorkspaceSwitcher } from "@/components/dashboard/WorkspaceSwitcher";
import { Logo } from "@/components/ui/Logo";
import { dashboardNav } from "@/lib/dashboard";
import { isDashboardNavActive } from "@/lib/dashboard-nav";

export function DashboardMobileNav({ ready }: { ready: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const main = dashboardNav.filter((item) => item.section !== "footer");
  const footer = dashboardNav.filter((item) => item.section === "footer");

  useEffect(() => {
    effectInit(() => setOpen(false));
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-ink hover:bg-surface"
        aria-label="Open menu"
        aria-expanded={open}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden
        >
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute top-0 left-0 flex h-full w-[min(100%,18rem)] flex-col border-r border-border bg-white shadow-xl">
            <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-4">
              <Logo className="text-base" />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-ink"
                aria-label="Close menu"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            {ready && (
              <div className="border-b border-border px-4 py-3">
                <WorkspaceSwitcher />
              </div>
            )}

            <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
              {main.map((item) => (
                <DashboardNavLink
                  key={item.id}
                  item={item}
                  active={isDashboardNavActive(pathname, item.href)}
                  onNavigate={() => setOpen(false)}
                />
              ))}
            </nav>

            <div className="shrink-0 border-t border-border px-3 py-4">
              {footer.map((item) => (
                <DashboardNavLink
                  key={item.id}
                  item={item}
                  active={isDashboardNavActive(pathname, item.href)}
                  onNavigate={() => setOpen(false)}
                />
              ))}
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="mt-2 flex min-h-[44px] items-center rounded-xl px-3 py-2.5 text-sm font-medium text-muted hover:bg-surface hover:text-ink"
              >
                ← Marketing site
              </Link>
              <SignOutButton className="mt-2 flex min-h-[44px] w-full items-center justify-center rounded-xl border border-border px-3 py-2.5 text-sm font-semibold text-ink hover:bg-surface disabled:opacity-60" />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
