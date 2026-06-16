"use client";

import { IntegrationsPanel } from "@/components/dashboard/integrations/IntegrationsPanel";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";

export function IntegrationsPageClient() {
  const { workspace, ready } = useWorkspaceContext();
  const workspaceId = workspace?.workspaceId ?? workspace?.id;

  if (!ready || !workspaceId) return null;

  return <IntegrationsPanel workspaceId={workspaceId} />;
}
