"use client";

import { DashboardNoWorkspaceEmpty } from "@/components/dashboard/layout/DashboardNoWorkspaceEmpty";
import { NotificationPreferencesPanel } from "@/components/dashboard/NotificationPreferencesPanel";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";

export function NotificationsSettingsPageClient() {
  const { workspace, ready, refresh } = useWorkspaceContext();
  const workspaceId = workspace?.workspaceId ?? workspace?.id;

  if (!ready) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-10 w-48 rounded-lg bg-surface" />
        <div className="h-64 rounded-2xl bg-surface" />
      </div>
    );
  }

  if (!workspaceId) {
    return (
      <DashboardNoWorkspaceEmpty description="Complete setup to create your workspace, then return here to configure notification preferences." />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Notifications</h1>
        <p className="mt-1 text-sm text-muted">
          Control when and how CitePilot sends citation alerts — email, Slack, and
          webhooks (Fleet).
        </p>
      </div>
      <NotificationPreferencesPanel
        workspaceId={workspaceId}
        onMonitoringEmailSaved={() => {
          void refresh();
        }}
      />
    </div>
  );
}
