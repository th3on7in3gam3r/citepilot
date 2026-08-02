"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { DashboardMobileNav } from "@/components/dashboard/DashboardMobileNav";
import { ImpersonationBanner } from "@/components/admin/ImpersonationBanner";
import { CopilotPanel } from "@/components/dashboard/copilot/CopilotPanel";
import { CopilotProvider, useCopilot } from "@/components/dashboard/copilot/CopilotProvider";
import { GridFilterProvider } from "@/components/dashboard/copilot/GridFilterProvider";
import { GlobalFilterModal } from "@/components/dashboard/filters/GlobalFilterModal";
import { DashboardCommandPalette } from "@/components/dashboard/DashboardCommandPalette";
import { DashboardAuthGate } from "@/components/dashboard/DashboardAuthGate";
import { DashboardRail } from "@/components/dashboard/layout/DashboardRail";
import { DashboardTopBar } from "@/components/dashboard/layout/DashboardTopBar";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { WorkspaceProvider, useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { WorkspaceSwitcherProvider, useWorkspaceSwitcher } from "@/contexts/WorkspaceSwitcherContext";
import { WorkspaceSwitcherModal } from "@/components/dashboard/workspaces/WorkspaceSwitcherModal";
import { WorkspaceCreationWizard } from "@/components/dashboard/workspaces/WorkspaceCreationWizard";
import { BillingProvider } from "@/contexts/BillingContext";
import { UpgradeModalProvider } from "@/contexts/UpgradeModalContext";
import { DashboardUsageLimitBanner } from "@/components/dashboard/DashboardUsageLimitBanner";
import { IntegrationHealthBanner } from "@/components/dashboard/integrations/IntegrationHealthBanner";
import { GeoScoreBadgePrompt } from "@/components/dashboard/GeoScoreBadgePrompt";
import { ProductTour } from "@/components/dashboard/onboarding/ProductTour";
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
  if (pathname.startsWith("/dashboard/workspaces")) {
    return {
      title: "Workspaces",
      backHref: "/dashboard",
      backLabel: "Overview",
    };
  }
  if (pathname.startsWith("/dashboard/content")) {
    return {
      title: "Content Studio",
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

function SettingsIcon() {
  return (
    <svg
      width="17"
      height="17"
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
  );
}

function DashboardShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { ready } = useWorkspaceContext();
  const { openCopilot } = useCopilot();
  const { title } = pageHeader(pathname);

  return (
    <div className="dash-main flex h-[100dvh] overflow-hidden">
      <div className="hidden shrink-0 lg:block">
        <DashboardRail />
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="dash-topbar flex min-h-[3.75rem] shrink-0 items-center gap-2.5 px-4 lg:hidden">
          <DashboardMobileNav ready={ready} />
          <h1 className="min-w-0 flex-1 truncate text-base font-semibold tracking-tight text-ink">
            {title}
          </h1>
          <Link
            href="/dashboard/settings"
            className="dash-icon-btn"
            aria-label="Settings"
            title="Settings"
          >
            <SettingsIcon />
          </Link>
          <ThemeToggle />
          <button
            type="button"
            onClick={openCopilot}
            className="dash-chrome-btn dash-chrome-btn--accent px-2.5 text-[10px]"
          >
            <span aria-hidden>✦</span>
            Copilot
          </button>
        </div>
        <div className="hidden lg:block">
          <DashboardTopBar title={title} />
        </div>
        <ImpersonationBanner />
        <main
          id="main-content"
          tabIndex={-1}
          className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-6 md:py-6 lg:px-8"
        >
          <div className="dash-page">
            <DashboardUsageLimitBanner />
            <IntegrationHealthBanner />
            <GeoScoreBadgePrompt />
            <Suspense fallback={null}>
              <ProductTour />
            </Suspense>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function WorkspaceModals() {
  const { switcherOpen, setSwitcherOpen } = useWorkspaceSwitcher();
  return (
    <>
      <WorkspaceSwitcherModal open={switcherOpen} onClose={() => setSwitcherOpen(false)} />
      <WorkspaceCreationWizard />
    </>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <DashboardAuthGate>
      <BillingProvider>
        <UpgradeModalProvider>
          <WorkspaceProvider>
            <WorkspaceSwitcherProvider>
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
                  <WorkspaceModals />
                </CopilotProvider>
              </GridFilterProvider>
            </WorkspaceSwitcherProvider>
          </WorkspaceProvider>
        </UpgradeModalProvider>
      </BillingProvider>
    </DashboardAuthGate>
  );
}
