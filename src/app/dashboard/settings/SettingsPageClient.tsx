"use client";

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
      <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
        <p className="font-display text-lg font-bold text-ink">No workspace yet</p>
        <p className="mt-2 text-sm text-muted">
          Complete onboarding to create your workspace, then return here to edit settings.
        </p>
        <a
          href="/start"
          className="mt-6 inline-block rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white"
        >
          Start setup →
        </a>
      </div>
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
