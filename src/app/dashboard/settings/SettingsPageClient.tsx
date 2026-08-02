"use client";

import { DashboardNoWorkspaceEmpty } from "@/components/dashboard/layout/DashboardNoWorkspaceEmpty";
import { SettingsForm } from "@/components/dashboard/SettingsForm";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";

export function SettingsPageClient() {
  const { workspace, ready, refresh, applyWorkspace } = useWorkspaceContext();

  if (!ready) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-10 w-48 rounded-lg bg-surface" />
        <div className="h-64 rounded-2xl bg-surface" />
      </div>
    );
  }

  if (!workspace?.workspaceId && !workspace?.id) {
    return (
      <DashboardNoWorkspaceEmpty description="Complete setup to create your workspace, then return here to edit settings." />
    );
  }

  return (
    <SettingsForm
      workspace={{
        ...workspace,
        workspaceId: workspace.workspaceId ?? workspace.id,
      }}
      onSaved={(updated) => {
        const id =
          updated?.id ?? workspace?.workspaceId ?? workspace?.id ?? undefined;
        if (updated && id) {
          applyWorkspace(updated, id);
        } else {
          void refresh();
        }
      }}
      onDeleted={refresh}
    />
  );
}
