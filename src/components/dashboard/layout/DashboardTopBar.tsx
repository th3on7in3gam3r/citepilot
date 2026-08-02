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
import { useWorkspaceSwitcher } from "@/contexts/WorkspaceSwitcherContext";
import { dashboardBreadcrumbs } from "@/lib/dashboard-breadcrumbs";
import { authClient } from "@/lib/auth/client";

export function DashboardTopBar({
  title = "Overview",
}: {
  title?: string;
}) {
  const pathname = usePathname();
  const { ready, workspace } = useWorkspaceContext();
  const { openCopilot } = useCopilot();
  const upgradeModal = useUpgradeModalOptional();
  const [showAddSiteForm, setShowAddSiteForm] = useState(false);
  const { openWizard } = useWorkspaceSwitcher();
  const hasWorkspace = Boolean(workspace?.workspaceId ?? workspace?.id);
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
      <div className="flex min-h-[3.75rem] flex-wrap items-center gap-3 px-5 py-2.5 lg:px-8">
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

            <div className="dash-chrome-group">
              {hasWorkspace ? (
                <Link
                  href="/dashboard/geo-audit"
                  data-tour="run-scan"
                  className="dash-chrome-group__item"
                >
                  Run audit
                </Link>
              ) : (
                <span
                  className="dash-chrome-group__item dash-chrome-group__item--disabled"
                  title="Create a workspace first"
                  aria-disabled="true"
                >
                  Run audit
                </span>
              )}
              <span className="dash-chrome-group__divider" aria-hidden />
              <button
                type="button"
                onClick={() => {
                  if (hasWorkspace) {
                    setShowAddSiteForm(true);
                  } else {
                    openWizard();
                  }
                }}
                className="dash-chrome-group__item"
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
                className="btn-dash-primary btn-dash-primary--sm hidden sm:inline-flex"
              >
                Upgrade to Pilot
              </button>
            )}

            <ThemeToggle />

            <button
              type="button"
              onClick={openCopilot}
              className="dash-chrome-btn dash-chrome-btn--accent"
            >
              <span aria-hidden>✦</span>
              <span className="hidden sm:inline">Copilot</span>
            </button>

            <Link
              href="/dashboard/settings#notifications"
              className="dash-icon-btn"
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
          <div className="ml-auto flex items-center gap-2">
            <div className="dash-shell-skeleton-block h-9 w-36 rounded-lg" />
            <div className="dash-shell-skeleton-block h-9 w-9 rounded-full" />
          </div>
        )}
      </div>
    </header>
  );
}
