"use client";

import { usePathname } from "next/navigation";
import { DashboardMobileNav } from "@/components/dashboard/DashboardMobileNav";
import { CopilotPanel } from "@/components/dashboard/copilot/CopilotPanel";
import { CopilotProvider, useCopilot } from "@/components/dashboard/copilot/CopilotProvider";
import { GridFilterProvider } from "@/components/dashboard/copilot/GridFilterProvider";
import { GlobalFilterModal } from "@/components/dashboard/filters/GlobalFilterModal";
import { DashboardRail } from "@/components/dashboard/layout/DashboardRail";
import { DashboardTopBar } from "@/components/dashboard/layout/DashboardTopBar";
import { WorkspaceProvider, useWorkspaceContext } from "@/contexts/WorkspaceContext";
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
    <div className="flex h-[100dvh] overflow-hidden bg-[#f4f6f8]">
      <div className="hidden shrink-0 lg:block">
        <DashboardRail />
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-[#e8edf3] bg-white px-4 lg:hidden">
          <DashboardMobileNav ready={ready} />
          <span className="font-display min-w-0 flex-1 truncate text-lg font-bold text-[#0f172a]">
            {title}
          </span>
          <button
            type="button"
            onClick={openCopilot}
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#0ea5e9]/30 bg-[#e0f2fe] px-2.5 py-1.5 text-[10px] font-semibold text-[#0284c7]"
          >
            ✦ Copilot
          </button>
        </div>
        <div className="hidden lg:block">
          <DashboardTopBar title={title} backHref={backHref} backLabel={backLabel} />
        </div>
        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-6 md:py-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceProvider>
      <GridFilterProvider>
        <CopilotProvider>
          <DashboardShellInner>{children}</DashboardShellInner>
          <CopilotPanel />
          <GlobalFilterModal />
        </CopilotProvider>
      </GridFilterProvider>
    </WorkspaceProvider>
  );
}
