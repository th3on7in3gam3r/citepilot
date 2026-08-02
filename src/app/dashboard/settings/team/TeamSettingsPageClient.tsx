"use client";

import { WorkspaceTeamPanel } from "@/components/dashboard/workspaces/WorkspaceTeamPanel";
import { DashboardNoWorkspaceEmpty } from "@/components/dashboard/layout/DashboardNoWorkspaceEmpty";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { authClient } from "@/lib/auth/client";
import { getStoredWorkspaceId } from "@/lib/client/api";
import { useEffect, useState } from "react";

export function TeamSettingsPageClient() {
  const { workspace, workspaces, ready } = useWorkspaceContext();
  const workspaceId = workspace?.workspaceId ?? workspace?.id ?? getStoredWorkspaceId();
  const active = workspaces.find((w) => w.id === workspaceId);
  const [ownerEmail, setOwnerEmail] = useState<string | null>(null);

  useEffect(() => {
    void authClient.getSession().then(({ data }) => {
      setOwnerEmail(data?.user?.email ?? null);
    });
  }, []);

  if (!ready) {
    return <div className="h-40 animate-pulse rounded-2xl bg-surface" />;
  }

  if (!workspaceId || !active) {
    return (
      <DashboardNoWorkspaceEmpty description="Create or select a workspace to manage its team." />
    );
  }

  return (
    <WorkspaceTeamPanel
      workspaceId={workspaceId}
      domain={active.domain}
      ownerEmail={ownerEmail}
    />
  );
}
