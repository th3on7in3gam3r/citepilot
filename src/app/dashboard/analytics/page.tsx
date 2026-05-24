"use client";

import { AnalyticsDashboard } from "@/components/dashboard/AnalyticsDashboard";
import { DashboardPageHeader } from "@/components/dashboard/DashboardUI";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { productFeatures } from "@/lib/features";

const feature = productFeatures.find((f) => f.id === "llm-tracking")!;

export default function AnalyticsPage() {
  const { workspace, ready } = useWorkspaceContext();
  if (!ready || !workspace) return null;

  return (
    <>
      <DashboardPageHeader
        title="Analytics"
        description={feature.description}
      />
      <AnalyticsDashboard workspace={workspace} />
    </>
  );
}
