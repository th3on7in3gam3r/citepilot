"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { useCopilot } from "@/components/dashboard/copilot/CopilotProvider";
import { WorkspaceSwitcher } from "@/components/dashboard/WorkspaceSwitcher";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useUpgradeModalOptional } from "@/contexts/UpgradeModalContext";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { dashboardBreadcrumbs } from "@/lib/dashboard-breadcrumbs";
import { authClient } from "@/lib/auth/client";

function TopBarButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`inline-flex h-9 items-center justify-center rounded-lg border border-[var(--dashboard-sidebar-border)] bg-[var(--dashboard-panel)] px-3 text-xs font-semibold text-ink transition hover:bg-surface ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function DashboardTopBar({
  title = "Overview",
}: {
  title?: string;
}) {
  const pathname = usePathname();
  const { ready } = useWorkspaceContext();
  const { openCopilot } = useCopilot();
  const upgradeModal = useUpgradeModalOptional();
  const [showAddSiteForm, setShowAddSiteForm] = useState(false);
  const [initial, setInitial] = useState<string | null>(null);
  const [userLabel, setUserLabel] = useState<string | null>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const accountMenuId = useId();

  const crumbs = dashboardBreadcrumbs(pathname);

  useEffect(() => {
    authClient.getSession().then(({ data }) => {
      if (!data?.user) return;
      const name = data.user.name || "";
      const email = data.user.email || "";
      const letter = name.trim() ? name[0] : email.trim() ? email[0] : "";
      if (letter) setInitial(letter.toUpperCase());
      setUserLabel(name.trim() || email.trim() || null);
    });
  }, []);

  useEffect(() => {
    setAccountMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (!accountMenuRef.current?.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  useEffect(() => {
    if (!accountMenuOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setAccountMenuOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [accountMenuOpen]);

  useEffect(() => {
    void fetch("/api/billing/status", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { isFleet?: boolean; isPilot?: boolean } | null) => {
        setIsPaid(Boolean(data?.isFleet || data?.isPilot));
      })
      .catch(() => undefined);
  }, []);

  const showUpgrade = !isPaid;

  return (
    <header className="dash-topbar sticky top-0 z-20 shrink-0">
      <div className="flex min-h-[60px] flex-wrap items-center gap-3 px-5 py-2.5 lg:px-8">
        <div className="min-w-0 flex-1 basis-[220px]">
          <nav
            aria-label="Breadcrumb"
            className="mb-1 flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-muted"
          >
            {crumbs.map((crumb, index) => {
              const isLast = index === crumbs.length - 1;
              return (
                <span key={`${crumb.label}-${index}`} className="inline-flex items-center gap-1.5">
                  {index > 0 && (
                    <span aria-hidden className="text-[var(--dashboard-sidebar-border)]">
                      /
                    </span>
                  )}
                  {crumb.href && !isLast ? (
                    <Link
                      href={crumb.href}
                      className="transition hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className={isLast ? "text-ink/70" : undefined}>{crumb.label}</span>
                  )}
                </span>
              );
            })}
          </nav>
          <h1 className="truncate text-[1.125rem] font-semibold tracking-tight text-ink">
            {title}
          </h1>
        </div>

        {ready ? (
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
            <div className="hidden min-w-[180px] max-w-[240px] flex-1 md:block">
              <WorkspaceSwitcher
                variant="bar"
                showAddForm={showAddSiteForm}
                onAddFormConsumed={() => setShowAddSiteForm(false)}
              />
            </div>

            <div className="hidden items-center gap-1 rounded-lg border border-[var(--dashboard-sidebar-border)] bg-[var(--dashboard-panel)] p-1 lg:flex">
              <Link
                href="/dashboard/geo-audit"
                data-tour="run-scan"
                className="rounded-md px-3 py-1.5 text-xs font-semibold text-muted transition hover:bg-surface hover:text-ink"
              >
                Run audit
              </Link>
              <span className="h-4 w-px bg-[var(--dashboard-sidebar-border)]" aria-hidden />
              <button
                type="button"
                onClick={() => setShowAddSiteForm(true)}
                className="rounded-md px-3 py-1.5 text-xs font-semibold text-muted transition hover:bg-surface hover:text-ink"
              >
                Add site
              </button>
            </div>

            {showUpgrade && (
              <button
                type="button"
                onClick={() =>
                  upgradeModal?.openUpgradeModal({
                    feature: "dashboard_upgrade",
                    title: "Upgrade to Pilot",
                    description:
                      "Unlock weekly monitoring, Slack alerts, and more citation scans for your workspace.",
                    plan: "pilot",
                  })
                }
                className="hidden rounded-lg bg-accent px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-accent-deep sm:inline-flex"
              >
                Upgrade to Pilot
              </button>
            )}

            <ThemeToggle />

            <TopBarButton
              onClick={openCopilot}
              className="gap-1.5 border-accent/20 bg-accent/5 text-accent-deep dark:text-accent"
            >
              <span aria-hidden>✦</span>
              <span className="hidden sm:inline">Copilot</span>
            </TopBarButton>

            <Link
              href="/dashboard/settings#notifications"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--dashboard-sidebar-border)] bg-[var(--dashboard-panel)] text-muted transition hover:bg-surface hover:text-ink"
              aria-label="Notification settings"
              title="Citation alerts & notification settings"
            >
              <svg className="h-[17px] w-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </Link>

            <div ref={accountMenuRef} className="relative">
              <button
                type="button"
                id={`${accountMenuId}-trigger`}
                aria-expanded={accountMenuOpen}
                aria-haspopup="menu"
                aria-controls={accountMenuId}
                onClick={() => setAccountMenuOpen((open) => !open)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent ring-1 ring-accent/20 transition hover:bg-accent/15"
                aria-label="Account menu"
                title="Account menu"
              >
                {initial ?? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
              </button>

              {accountMenuOpen && (
                <div
                  id={accountMenuId}
                  role="menu"
                  aria-labelledby={`${accountMenuId}-trigger`}
                  className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-[var(--dashboard-sidebar-border)] bg-[var(--dashboard-panel)] py-1 shadow-lg"
                >
                  {userLabel && (
                    <p className="truncate px-3 py-2 text-xs font-medium text-muted" title={userLabel}>
                      {userLabel}
                    </p>
                  )}
                  <Link
                    href="/dashboard/settings"
                    role="menuitem"
                    onClick={() => setAccountMenuOpen(false)}
                    className="block px-3 py-2 text-sm font-medium text-ink transition hover:bg-surface"
                  >
                    Account settings
                  </Link>
                  <div className="my-1 border-t border-[var(--dashboard-sidebar-border)]" />
                  <div className="px-3 py-2" role="none">
                    <SignOutButton className="w-full text-left text-sm font-medium text-muted transition hover:text-ink disabled:opacity-60" />
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="ml-auto h-9 w-40 animate-pulse rounded-lg bg-surface" />
        )}
      </div>
    </header>
  );
}
