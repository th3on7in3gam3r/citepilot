"use client";

import { useState } from "react";
import { FleetApiKeysPanel } from "@/components/dashboard/FleetApiKeysPanel";
import { Panel } from "@/components/dashboard/DashboardUI";
import { PromptImportModal } from "@/components/dashboard/prompts/PromptImportModal";

export function FleetSettingsPanel({
  workspaceId,
  domain,
  existingPrompts,
  onPromptsImported,
}: {
  workspaceId: string;
  domain: string;
  existingPrompts: string[];
  onPromptsImported: () => void;
}) {
  const [importOpen, setImportOpen] = useState(false);

  return (
    <>
      <Panel title="Fleet — bulk prompt import" className="mt-6" id="fleet-import">
        <p className="mb-4 text-sm text-muted">
          Import prompts from CSV, JSON, or pre-built templates. New prompts are
          merged with your existing list (duplicates skipped).
        </p>
        <button
          type="button"
          onClick={() => setImportOpen(true)}
          className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-ink hover:bg-surface"
        >
          Import prompts
        </button>
      </Panel>

      <PromptImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        workspaceId={workspaceId}
        domain={domain}
        existingPrompts={existingPrompts}
        onImported={onPromptsImported}
      />

      <FleetApiKeysPanel workspaceId={workspaceId} />
    </>
  );
}
