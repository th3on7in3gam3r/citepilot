"use client";

import { useEffect, useState } from "react";
import {
  COMPETITOR_FILTER_COLUMNS,
  FILTER_OPERATORS,
  type GridFilterCondition,
} from "@/lib/copilot/grid-filters";

export function FilterBuilderModal({
  open,
  filters,
  generating,
  onClose,
  onAdd,
  onUpdate,
  onRemove,
  onApply,
}: {
  open: boolean;
  filters: GridFilterCondition[];
  generating: boolean;
  onClose: () => void;
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<GridFilterCondition>) => void;
  onRemove: (id: string) => void;
  onApply: () => void;
}) {
  const [runningSec, setRunningSec] = useState(0);

  useEffect(() => {
    if (!generating) {
      setRunningSec(0);
      return;
    }
    const t = setInterval(() => setRunningSec((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [generating]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[#0f172a]/30 backdrop-blur-[2px]"
        aria-label="Close filters"
        onClick={onClose}
      />
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-[#e8edf3] bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-[#eef2f6] px-5 py-4">
          <h2 className="font-display text-lg font-bold text-[#0f172a]">Add filters</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#94a3b8] hover:bg-[#f8fafb]"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="max-h-[calc(90vh-8rem)] overflow-y-auto px-5 py-4">
          <div className="mb-3 grid grid-cols-[72px_1fr_1fr_1fr_32px] gap-2 text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]">
            <span />
            <span>Column</span>
            <span>Operator</span>
            <span>Values</span>
            <span />
          </div>

          <div className="space-y-2">
            {filters.map((row) => (
              <FilterRow
                key={row.id}
                row={row}
                generating={generating && !!row.generating}
                runningSec={runningSec}
                onUpdate={(patch) => onUpdate(row.id, patch)}
                onRemove={() => onRemove(row.id)}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={onAdd}
            disabled={generating}
            className="mt-4 text-sm font-medium text-[#0ea5e9] hover:text-[#0284c7] disabled:opacity-40"
          >
            + Add condition
          </button>
        </div>

        <footer className="flex justify-end gap-2 border-t border-[#eef2f6] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#e2e8f0] px-5 py-2.5 text-sm font-semibold text-[#64748b] hover:bg-[#f8fafb]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={generating}
            onClick={onApply}
            className="rounded-xl bg-[#0ea5e9] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0284c7] disabled:opacity-50"
          >
            Apply filters
          </button>
        </footer>
      </div>
    </div>
  );
}

function FilterRow({
  row,
  generating,
  runningSec,
  onUpdate,
  onRemove,
}: {
  row: GridFilterCondition;
  generating: boolean;
  runningSec: number;
  onUpdate: (patch: Partial<GridFilterCondition>) => void;
  onRemove: () => void;
}) {
  const col = COMPETITOR_FILTER_COLUMNS.find((c) => c.id === row.columnId);
  const ops = FILTER_OPERATORS.filter((o) =>
    col ? o.types.includes(col.type) : true,
  );

  if (generating) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-[#bae6fd] bg-[#e0f2fe]/60 px-4 py-3">
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#0ea5e9] border-t-transparent" />
        <span className="flex-1 text-sm font-medium text-[#0284c7]">Generating filter</span>
        <span className="text-xs text-[#64748b]">Running {runningSec}s</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[72px_1fr_1fr_1fr_32px] items-center gap-2">
      <select
        value={row.logic}
        onChange={(e) =>
          onUpdate({ logic: e.target.value as GridFilterCondition["logic"] })
        }
        className="rounded-lg border border-[#e2e8f0] px-2 py-2 text-xs font-medium text-[#334155] outline-none"
      >
        <option value="where">Where</option>
        <option value="and">AND</option>
        <option value="or">OR</option>
      </select>

      <select
        value={row.columnId}
        onChange={(e) => onUpdate({ columnId: e.target.value })}
        className="rounded-lg border border-[#e2e8f0] px-2 py-2.5 text-sm outline-none focus:border-[#0ea5e9]"
      >
        {COMPETITOR_FILTER_COLUMNS.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>

      <select
        value={row.operator}
        onChange={(e) =>
          onUpdate({ operator: e.target.value as GridFilterCondition["operator"] })
        }
        className="rounded-lg border border-[#e2e8f0] px-2 py-2.5 text-sm outline-none focus:border-[#0ea5e9]"
      >
        {ops.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>

      <input
        type="text"
        value={row.value}
        disabled={row.operator === "is_empty"}
        onChange={(e) => onUpdate({ value: e.target.value })}
        placeholder="Value"
        className="rounded-lg border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none focus:border-[#0ea5e9] disabled:bg-[#f8fafb]"
      />

      <button
        type="button"
        onClick={onRemove}
        className="rounded-lg p-2 text-[#94a3b8] hover:bg-red-50 hover:text-red-600"
        aria-label="Remove condition"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}
