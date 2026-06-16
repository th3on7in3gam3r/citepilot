"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { PROMPT_TEMPLATE_CATEGORIES } from "@/lib/data/prompt-templates";
import {
  detectCategoryColumn,
  detectPromptColumn,
  parseCsvTable,
  rowsToImportInputs,
  sampleCsvTemplate,
} from "@/lib/prompts/csv";
import { downloadTextFile } from "@/lib/prompts/download";
import type { PromptImportInput } from "@/lib/prompts/types";
import { importSummaryMessage, validatePromptImports } from "@/lib/prompts/validate";
import { runAudit } from "@/lib/client/api";
import { useToast } from "@/components/notifications/ToastProvider";

type Step = "upload" | "preview" | "confirm" | "templates";

type PromptImportModalProps = {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  domain: string;
  existingPrompts: string[];
  onImported: () => void;
};

export function PromptImportModal({
  open,
  onClose,
  workspaceId,
  domain,
  existingPrompts,
  onImported,
}: PromptImportModalProps) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [rawText, setRawText] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [promptCol, setPromptCol] = useState(0);
  const [categoryCol, setCategoryCol] = useState(-1);
  const [importing, setImporting] = useState(false);
  const [launchScan, setLaunchScan] = useState(true);

  const reset = useCallback(() => {
    setStep("upload");
    setRawText("");
    setHeaders([]);
    setRows([]);
    setPromptCol(0);
    setCategoryCol(-1);
    setLaunchScan(true);
  }, []);

  function close() {
    reset();
    onClose();
  }

  function parseUploadedText(text: string) {
    const table = parseCsvTable(text);
    if (table.rows.length === 0 && table.headers.length === 0) {
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.length === 0) {
        toast.error("No prompts found in file");
        return;
      }
      setHeaders(["prompt_text"]);
      setRows(lines.map((line) => [line]));
      setPromptCol(0);
      setCategoryCol(-1);
    } else {
      setHeaders(table.headers);
      setRows(table.rows);
      setPromptCol(detectPromptColumn(table.headers));
      setCategoryCol(detectCategoryColumn(table.headers));
    }
    setRawText(text);
    setStep("preview");
  }

  function handleFile(file: File) {
    void file.text().then(parseUploadedText);
  }

  const inputs = useMemo(
    () => rowsToImportInputs(headers, rows, promptCol, categoryCol),
    [headers, rows, promptCol, categoryCol],
  );

  const validation = useMemo(
    () => validatePromptImports(inputs, existingPrompts),
    [inputs, existingPrompts],
  );

  const previewRows = validation.preview.slice(0, 5);
  const duplicateCount = validation.issues.filter((i) => i.reason === "duplicate").length;
  const errorCount = validation.issues.filter((i) => i.reason !== "duplicate").length;

  function loadTemplates(categoryId: string) {
    const category = PROMPT_TEMPLATE_CATEGORIES.find((c) => c.id === categoryId);
    if (!category) return;
    const text = [
      "prompt_text,category",
      ...category.prompts.map((p) => `"${p.replace(/"/g, '""')}","${category.label}"`),
    ].join("\n");
    parseUploadedText(text);
    setStep("preview");
  }

  async function confirmImport() {
    if (validation.valid.length === 0) {
      toast.error("No valid prompts to import");
      return;
    }

    setImporting(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/prompts/import`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompts: validation.valid }),
      });
      const data = (await res.json()) as {
        error?: string;
        imported?: number;
        skipped?: number;
        errors?: { prompt_text: string; reason: string }[];
        monitoredPrompts?: string[];
      };

      if (!res.ok) {
        toast.error(data.error ?? "Import failed");
        return;
      }

      const imported = data.imported ?? 0;
      toast.success(
        `${imported} prompt${imported === 1 ? "" : "s"} imported.${launchScan ? " Running initial scan…" : ""}`,
      );

      if (data.monitoredPrompts) onImported();

      if (launchScan && imported > 0) {
        const prompts = data.monitoredPrompts ?? validation.valid.map((p) => p.prompt_text);
        await runAudit({
          domain,
          prompts: prompts.slice(-Math.max(imported, 1)),
          workspaceId,
        }).catch(() => undefined);
      }

      close();
    } finally {
      setImporting(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[140] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Import prompts"
      onClick={close}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-border px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold text-ink">Import prompts</h2>
              <p className="mt-0.5 text-xs text-muted">
                Step {step === "upload" || step === "templates" ? 1 : step === "preview" ? 2 : 3} of 3
              </p>
            </div>
            <button
              type="button"
              onClick={close}
              className="rounded-lg px-2 py-1 text-sm text-muted hover:bg-surface"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <div className="mt-3 flex justify-center gap-2">
            {["upload", "preview", "confirm"].map((s, i) => (
              <span
                key={s}
                className={`h-2 w-2 rounded-full ${
                  (step === "upload" && i === 0) ||
                  (step === "templates" && i === 0) ||
                  (step === "preview" && i <= 1) ||
                  (step === "confirm" && i <= 2)
                    ? "bg-accent"
                    : "bg-border"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {(step === "upload" || step === "templates") && (
            <div className="space-y-5">
              {step === "upload" && (
                <>
                  <div
                    className="rounded-xl border-2 border-dashed border-border bg-surface/50 p-8 text-center"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (file) handleFile(file);
                    }}
                  >
                    <p className="text-sm font-semibold text-ink">Drag & drop a CSV file</p>
                    <p className="mt-1 text-xs text-muted">or paste prompts below</p>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".csv,text/csv"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFile(file);
                        e.target.value = "";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="mt-4 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold"
                    >
                      Choose file
                    </button>
                  </div>

                  <textarea
                    rows={6}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder={`prompt_text,category\n"best CRM for agencies","Commercial"`}
                    className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm"
                  />

                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() =>
                        downloadTextFile(sampleCsvTemplate(), "citepilot-prompts-sample.csv", "text/csv")
                      }
                      className="font-semibold text-accent hover:underline"
                    >
                      Download sample CSV
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep("templates")}
                      className="font-semibold text-accent hover:underline"
                    >
                      Browse templates →
                    </button>
                  </div>
                </>
              )}

              {step === "templates" && (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setStep("upload")}
                    className="text-sm text-muted hover:text-ink"
                  >
                    ← Back to upload
                  </button>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {PROMPT_TEMPLATE_CATEGORIES.map((category) => (
                      <div
                        key={category.id}
                        className="rounded-xl border border-border bg-surface/50 p-4"
                      >
                        <p className="font-semibold text-ink">{category.label}</p>
                        <p className="mt-1 text-xs text-muted">{category.description}</p>
                        <p className="mt-2 text-xs font-semibold text-muted">
                          {category.prompts.length} prompts
                        </p>
                        <button
                          type="button"
                          onClick={() => loadTemplates(category.id)}
                          className="mt-3 rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-white"
                        >
                          Import all
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === "preview" && (
            <div className="space-y-4">
              {headers.length > 0 && (
                <div className="rounded-xl border border-border bg-surface/50 p-4">
                  <p className="text-xs font-semibold text-muted">Column mapping</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="text-sm">
                      <span className="text-muted">Prompt text column</span>
                      <select
                        value={promptCol}
                        onChange={(e) => setPromptCol(Number(e.target.value))}
                        className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                      >
                        {headers.map((header, idx) => (
                          <option key={header + idx} value={idx}>
                            {header || `Column ${idx + 1}`}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-sm">
                      <span className="text-muted">Category column (optional)</span>
                      <select
                        value={categoryCol}
                        onChange={(e) => setCategoryCol(Number(e.target.value))}
                        className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                      >
                        <option value={-1}>None</option>
                        {headers.map((header, idx) => (
                          <option key={`cat-${header}-${idx}`} value={idx}>
                            {header || `Column ${idx + 1}`}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
              )}

              <p className="text-sm font-semibold text-ink">
                {importSummaryMessage(
                  validation.valid.length,
                  duplicateCount,
                  errorCount,
                )}
              </p>

              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead className="bg-surface text-xs text-muted">
                    <tr>
                      <th className="px-3 py-2">#</th>
                      <th className="px-3 py-2">Prompt</th>
                      <th className="px-3 py-2">Category</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {previewRows.map((row) => (
                      <tr key={row.rowIndex}>
                        <td className="px-3 py-2 text-muted">{row.rowIndex}</td>
                        <td className="max-w-[240px] truncate px-3 py-2">{row.prompt_text}</td>
                        <td className="px-3 py-2">{row.category || "—"}</td>
                        <td className="px-3 py-2">
                          {row.valid ? (
                            <span className="text-mint">Valid</span>
                          ) : (
                            <span className="text-red-600">{row.issue}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {validation.preview.length > 5 && (
                <p className="text-xs text-muted">
                  Showing first 5 of {validation.preview.length} rows
                </p>
              )}
            </div>
          )}

          {step === "confirm" && (
            <div className="space-y-4">
              <p className="text-sm text-ink">
                Ready to import <strong>{validation.valid.length}</strong> prompt
                {validation.valid.length === 1 ? "" : "s"} into <strong>{domain}</strong>.
              </p>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={launchScan}
                  onChange={(e) => setLaunchScan(e.target.checked)}
                />
                Run initial scan after import
              </label>
            </div>
          )}
        </div>

        <div className="flex justify-between border-t border-border px-5 py-4">
          {step === "preview" ? (
            <button type="button" onClick={() => setStep("upload")} className="text-sm text-muted">
              ← Back
            </button>
          ) : step === "confirm" ? (
            <button type="button" onClick={() => setStep("preview")} className="text-sm text-muted">
              ← Back
            </button>
          ) : (
            <span />
          )}

          {step === "upload" && (
            <button
              type="button"
              disabled={!rawText.trim()}
              onClick={() => parseUploadedText(rawText)}
              className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Preview →
            </button>
          )}

          {step === "preview" && (
            <button
              type="button"
              disabled={validation.valid.length === 0}
              onClick={() => setStep("confirm")}
              className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Continue →
            </button>
          )}

          {step === "confirm" && (
            <button
              type="button"
              disabled={importing}
              onClick={() => void confirmImport()}
              className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {importing
                ? "Importing…"
                : `Import ${validation.valid.length} prompt${validation.valid.length === 1 ? "" : "s"}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
