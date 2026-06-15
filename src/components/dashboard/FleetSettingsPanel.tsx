"use client";

import { useRef, useState } from "react";
import { FleetApiKeysPanel } from "@/components/dashboard/FleetApiKeysPanel";
import { Panel } from "@/components/dashboard/DashboardUI";
import { useToast } from "@/components/notifications/ToastProvider";

export function FleetSettingsPanel({
  workspaceId,
  onPromptsImported,
}: {
  workspaceId: string;
  onPromptsImported: (prompts: string[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const toast = useToast();

  async function importCsv(file: File) {
    setImporting(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`/api/workspaces/${workspaceId}/prompts/import`, {
      method: "POST",
      credentials: "include",
      body: form,
    });
    const data = (await res.json()) as {
      error?: string;
      imported?: number;
      trimmed?: boolean;
      monitoredPrompts?: string[];
    };
    setImporting(false);
    if (!res.ok) {
      toast.error(data.error ?? "Import failed");
      return;
    }
    toast.success(
      `Imported ${data.imported} prompt${data.imported === 1 ? "" : "s"}`,
      {
        description: data.trimmed ? "Trimmed to your plan limit." : undefined,
      },
    );
    if (data.monitoredPrompts) onPromptsImported(data.monitoredPrompts);
  }

  return (
    <>
      <Panel title="Fleet — bulk prompt import" className="mt-6" id="fleet-import">
        <p className="mb-4 text-sm text-muted">
          Upload a CSV with a <code className="text-xs">prompt</code> column or one
          prompt per line. Imports replace your monitored prompt list.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void importCsv(file);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={importing}
          onClick={() => fileRef.current?.click()}
          className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-ink hover:bg-surface disabled:opacity-50"
        >
          {importing ? "Importing…" : "Import prompts from CSV"}
        </button>
      </Panel>

      <FleetApiKeysPanel workspaceId={workspaceId} />
    </>
  );
}
