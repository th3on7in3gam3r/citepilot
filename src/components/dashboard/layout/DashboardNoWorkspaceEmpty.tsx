"use client";

import { DashboardEmptyState } from "@/components/dashboard/layout/DashboardEmptyState";
import { useWorkspaceSwitcher } from "@/contexts/WorkspaceSwitcherContext";

/** Shared empty state when the signed-in user has no workspace yet. */
export function DashboardNoWorkspaceEmpty({
  description = "Add a site or complete setup to see citation data here — nothing below is real until you connect a domain.",
}: {
  description?: string;
}) {
  const { openWizard } = useWorkspaceSwitcher();

  return (
    <DashboardEmptyState
      title="No workspace yet"
      description={description}
      primaryHref="/start"
      primaryLabel="Start setup →"
      secondaryLabel="Add site"
      onSecondaryClick={openWizard}
    />
  );
}
