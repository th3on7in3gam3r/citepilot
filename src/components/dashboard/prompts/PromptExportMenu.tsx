"use client";

import { useEffect, useRef, useState } from "react";
import { buildPromptExportRecords } from "@/lib/prompts/export-data";
import { recordsToCsv } from "@/lib/prompts/csv";
import { downloadTextFile } from "@/lib/prompts/download";
import type { WorkspaceSnapshot } from "@/lib/dashboard";

export function PromptExportMenu({ workspace }: { workspace: WorkspaceSnapshot }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function exportCsv() {
    const records = buildPromptExportRecords(workspace);
    const csv = recordsToCsv(records);
    const domain = workspace.domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
    downloadTextFile(csv, `${domain}-prompts.csv`, "text/csv");
    setOpen(false);
  }

  function exportJson() {
    const records = buildPromptExportRecords(workspace);
    const domain = workspace.domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
    downloadTextFile(
      JSON.stringify(records, null, 2),
      `${domain}-prompts.json`,
      "application/json",
    );
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-xl border border-[#e2e8f0] bg-white px-4 py-2.5 text-sm font-semibold text-[#0f172a] transition hover:bg-[#f8fafb]"
      >
        Export ▾
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 min-w-[10rem] overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          <button
            type="button"
            onClick={exportCsv}
            className="block w-full px-4 py-2.5 text-left text-sm font-medium text-ink hover:bg-surface"
          >
            Export as CSV
          </button>
          <button
            type="button"
            onClick={exportJson}
            className="block w-full px-4 py-2.5 text-left text-sm font-medium text-ink hover:bg-surface"
          >
            Export as JSON
          </button>
        </div>
      )}
    </div>
  );
}
