"use client";

import { filterChipLabel, type GridFilterCondition } from "@/lib/copilot/grid-filters";

export function FilterChips({
  filters,
  onRemove,
  onAdd,
}: {
  filters: GridFilterCondition[];
  onRemove: (id: string) => void;
  onAdd: () => void;
}) {
  const active = filters.filter(
    (f) => !f.generating && (f.operator === "is_empty" || f.value.trim() !== ""),
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {active.map((f) => (
        <span
          key={f.id}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#e2e8f0] bg-white px-3 py-1.5 text-xs font-medium text-[#334155]"
        >
          {filterChipLabel(f)}
          <button
            type="button"
            onClick={() => onRemove(f.id)}
            className="text-[#94a3b8] hover:text-[#0f172a]"
            aria-label={`Remove filter ${filterChipLabel(f)}`}
          >
            ×
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-1 rounded-full border border-dashed border-[#0ea5e9]/50 bg-[#e0f2fe]/50 px-3 py-1.5 text-xs font-semibold text-[#0284c7] transition hover:border-[#0ea5e9] hover:bg-[#e0f2fe]"
      >
        + Add Filter
      </button>
    </div>
  );
}
