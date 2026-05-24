"use client";

import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { WorkspaceProvider, useWorkspaceContext } from "@/contexts/WorkspaceContext";

function DashboardShellInner({ children }: { children: React.ReactNode }) {
  const { workspace, ready } = useWorkspaceContext();

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-cream">
      <div className="hidden h-[100dvh] shrink-0 lg:block">
        <DashboardSidebar />
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-white px-6 lg:hidden">
          <span className="font-display text-lg font-bold text-ink">CitePilot</span>
          {ready && workspace && (
            <span className="truncate text-sm text-muted">{workspace.domain}</span>
          )}
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto px-6 py-8 md:px-10 md:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceProvider>
      <DashboardShellInner>{children}</DashboardShellInner>
    </WorkspaceProvider>
  );
}
