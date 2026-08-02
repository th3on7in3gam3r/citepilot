/** Loading placeholder aligned with dashboard card layout. */
export function DashboardContentSkeleton() {
  return (
    <div className="animate-pulse space-y-5 pb-8">
      <div className="dash-shell-skeleton-block h-16" />
      <div className="dash-shell-skeleton-block h-14 border border-[var(--dashboard-sidebar-border)]" />
      <div className="dash-shell-skeleton-block h-72 border border-[var(--dashboard-sidebar-border)]" />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="dash-shell-skeleton-block h-52 border border-[var(--dashboard-sidebar-border)]" />
        <div className="dash-shell-skeleton-block h-52 border border-[var(--dashboard-sidebar-border)]" />
      </div>
    </div>
  );
}

/** Full shell skeleton — rail, top bar, and page content. */
export function DashboardShellSkeleton() {
  return (
    <div className="dash-main flex h-[100dvh] overflow-hidden animate-pulse">
      <aside
        className="hidden h-full w-[280px] shrink-0 flex-col border-r border-[var(--dashboard-sidebar-border)] bg-[var(--dashboard-sidebar)] lg:flex"
        aria-hidden
      >
        <div className="flex h-[3.75rem] shrink-0 items-center gap-3 border-b border-[var(--dashboard-sidebar-border)] px-4">
          <div className="dash-shell-skeleton-block h-8 w-8 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="dash-shell-skeleton-block h-3.5 w-24" />
            <div className="dash-shell-skeleton-block h-2.5 w-16" />
          </div>
        </div>
        <div className="min-h-0 flex-1 space-y-2 overflow-hidden p-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="dash-shell-skeleton-block h-9 rounded-lg"
              style={{ opacity: 1 - index * 0.06 }}
            />
          ))}
        </div>
        <div className="shrink-0 border-t border-[var(--dashboard-sidebar-border)] p-3">
          <div className="dash-shell-skeleton-block h-14 rounded-[0.625rem]" />
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="dash-topbar flex min-h-[60px] items-center gap-3 px-5 py-2.5 lg:px-8">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="dash-shell-skeleton-block h-2.5 w-32" />
            <div className="dash-shell-skeleton-block h-5 w-40" />
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <div className="dash-shell-skeleton-block h-9 w-36 rounded-lg" />
            <div className="dash-shell-skeleton-block h-9 w-28 rounded-lg" />
            <div className="dash-shell-skeleton-block h-9 w-9 rounded-lg" />
          </div>
        </div>
        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-6 md:py-6 lg:px-8">
          <div className="dash-page">
            <DashboardContentSkeleton />
          </div>
        </main>
      </div>
    </div>
  );
}

/** @deprecated Use DashboardContentSkeleton or DashboardShellSkeleton. */
export function DashboardPageSkeleton() {
  return <DashboardContentSkeleton />;
}
