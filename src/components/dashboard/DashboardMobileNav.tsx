"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { effectInit } from "@/lib/react/effect-init";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { DashboardBrand } from "@/components/dashboard/layout/DashboardBrand";
import { DashboardSidebarNav } from "@/components/dashboard/layout/DashboardSidebarNav";
import { WorkspaceSwitcher } from "@/components/dashboard/WorkspaceSwitcher";
import { useFocusTrap } from "@/hooks/useFocusTrap";

const DASHBOARD_MOBILE_MENU_ID = "dashboard-mobile-menu";

export function DashboardMobileNav({ ready }: { ready: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useFocusTrap(dialogRef, open, () => setOpen(false));

  useEffect(() => {
    effectInit(() => setOpen(false));
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
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
        aria-controls={DASHBOARD_MOBILE_MENU_ID}
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

      {open &&
        mounted &&
        createPortal(
        <div
          ref={dialogRef}
          className="fixed inset-0 z-[100] isolate lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dashboard-mobile-menu-title"
        >
          <button
            type="button"
            className="absolute inset-0 z-0 bg-ink/60 backdrop-blur-sm"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <aside
            id={DASHBOARD_MOBILE_MENU_ID}
            className="dash-rail absolute top-0 left-0 z-10 flex h-full w-[min(100%,272px)] flex-col shadow-2xl"
          >
            <div className="dash-rail__brand flex items-center justify-between gap-2 pr-2">
              <DashboardBrand onNavigate={() => setOpen(false)} />
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

            <h2 id="dashboard-mobile-menu-title" className="sr-only">
              Dashboard navigation
            </h2>

            {ready && (
              <div className="border-b border-[var(--dashboard-sidebar-border)] px-4 py-3">
                <WorkspaceSwitcher />
              </div>
            )}

            <DashboardSidebarNav
              className="min-h-0 flex-1 overflow-y-auto px-3 py-3"
              onNavigate={() => setOpen(false)}
            />

            <div className="dash-rail__footer shrink-0 px-3 py-4">
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
        </div>,
        document.body,
      )}
    </>
  );
}
