/** Loading placeholder aligned with dashboard card layout. */
export function DashboardPageSkeleton() {
  return (
    <div className="animate-pulse space-y-5 pb-8">
      <div className="h-10 rounded-xl bg-white" />
      <div className="h-24 rounded-2xl border border-[#e8edf3] bg-white" />
      <div className="h-72 rounded-2xl border border-[#e8edf3] bg-white" />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="h-52 rounded-2xl border border-[#e8edf3] bg-white" />
        <div className="h-52 rounded-2xl border border-[#e8edf3] bg-white" />
      </div>
    </div>
  );
}
