"use client";

import { IntegrationsPanel } from "@/components/dashboard/integrations/IntegrationsPanel";
import { DashboardNoWorkspaceEmpty } from "@/components/dashboard/layout/DashboardNoWorkspaceEmpty";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";

export function IntegrationsPageClient() {
  const { workspace, ready } = useWorkspaceContext();
  const workspaceId = workspace?.workspaceId ?? workspace?.id;

  if (!ready) {
    return <div className="h-64 animate-pulse rounded-2xl bg-surface" />;
  }

  if (!workspaceId) {
    return (
      <DashboardNoWorkspaceEmpty description="Create a workspace to connect CMS, Slack, and other integrations." />
    );
  }

  return <IntegrationsPanel workspaceId={workspaceId} />;
}
