import { Suspense } from "react";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-40 rounded-2xl bg-surface" />}>
      <DashboardOverview />
    </Suspense>
  );
}
