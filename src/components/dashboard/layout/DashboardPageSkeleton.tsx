/** Loading placeholder aligned with dashboard card layout. */
export function DashboardPageSkeleton() {
  return (
    <div className="animate-pulse space-y-5 pb-8">
      <div className="h-16 rounded-xl bg-[var(--dashboard-panel)]" />
      <div className="h-14 rounded-xl border border-border bg-[var(--dashboard-panel)]" />
      <div className="h-72 rounded-xl border border-border bg-[var(--dashboard-panel)]" />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="h-52 rounded-xl border border-border bg-[var(--dashboard-panel)]" />
        <div className="h-52 rounded-xl border border-border bg-[var(--dashboard-panel)]" />
      </div>
    </div>
  );
}
