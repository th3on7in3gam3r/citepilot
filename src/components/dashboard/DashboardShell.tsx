"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { DashboardMobileNav } from "@/components/dashboard/DashboardMobileNav";
import { CopilotPanel } from "@/components/dashboard/copilot/CopilotPanel";
import { CopilotProvider, useCopilot } from "@/components/dashboard/copilot/CopilotProvider";
import { GridFilterProvider } from "@/components/dashboard/copilot/GridFilterProvider";
import { GlobalFilterModal } from "@/components/dashboard/filters/GlobalFilterModal";
import { DashboardCommandPalette } from "@/components/dashboard/DashboardCommandPalette";
import { DashboardRail } from "@/components/dashboard/layout/DashboardRail";
import { DashboardTopBar } from "@/components/dashboard/layout/DashboardTopBar";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { WorkspaceProvider, useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { BillingProvider } from "@/contexts/BillingContext";
import { UpgradeModalProvider } from "@/contexts/UpgradeModalContext";
import { DashboardUsageLimitBanner } from "@/components/dashboard/DashboardUsageLimitBanner";
import { GeoScoreBadgePrompt } from "@/components/dashboard/GeoScoreBadgePrompt";
import { DashboardUpgradeCelebration } from "@/components/dashboard/DashboardUpgradeCelebration";
import { PostHogIdentify } from "@/components/analytics/PostHogIdentify";
import { dashboardNav } from "@/lib/dashboard";

function pageHeader(pathname: string): {
  title: string;
  backHref: string | null;
  backLabel: string | null;
} {
  if (pathname === "/dashboard") {
    return {
      title: "Overview",
      backHref: null,
      backLabel: null,
    };
  }
  if (pathname.startsWith("/dashboard/content")) {
    return {
      title: "Site details",
      backHref: "/dashboard",
      backLabel: "Overview",
    };
  }
  const match = dashboardNav.find((item) =>
    pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href)),
  );
  return {
    title: match?.label ?? "Dashboard",
    backHref: "/dashboard",
    backLabel: "Overview",
  };
}

function DashboardShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { ready } = useWorkspaceContext();
  const { openCopilot } = useCopilot();
  const { title, backHref, backLabel } = pageHeader(pathname);

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[var(--dashboard-bg)]">
      <div className="hidden shrink-0 lg:block">
        <DashboardRail />
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4 lg:hidden dark:border-[#222]">
          <DashboardMobileNav ready={ready} />
          <span className="font-display min-w-0 flex-1 truncate text-lg font-bold text-ink">
            {title}
          </span>
          <Link
            href="/dashboard/settings"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-muted hover:bg-surface hover:text-ink"
            aria-label="Settings"
            title="Settings"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15a3 3 0 100-6 3 3 0 000 6z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
              />
            </svg>
          </Link>
          <ThemeToggle />
          <button
            type="button"
            onClick={openCopilot}
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1.5 text-[10px] font-semibold text-accent-deep dark:text-accent"
          >
            ✦ Copilot
          </button>
        </div>
        <div className="hidden lg:block">
          <DashboardTopBar title={title} backHref={backHref} backLabel={backLabel} />
        </div>
        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-6 md:py-6 lg:px-8">
          <DashboardUsageLimitBanner />
          <GeoScoreBadgePrompt />
          {children}
        </main>
      </div>
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <BillingProvider>
      <UpgradeModalProvider>
        <WorkspaceProvider>
          <GridFilterProvider>
            <CopilotProvider>
              <PostHogIdentify />
              <DashboardShellInner>{children}</DashboardShellInner>
              <Suspense fallback={null}>
                <DashboardUpgradeCelebration />
              </Suspense>
              <CopilotPanel />
              <GlobalFilterModal />
              <DashboardCommandPalette />
            </CopilotProvider>
          </GridFilterProvider>
        </WorkspaceProvider>
      </UpgradeModalProvider>
    </BillingProvider>
  );
}
