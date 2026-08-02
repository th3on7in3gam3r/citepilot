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
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-ink shadow-sm dark:border-[#333] dark:bg-[#111]"
        >
          {filterChipLabel(f)}
          <button
            type="button"
            onClick={() => onRemove(f.id)}
            className="text-muted hover:text-ink"
            aria-label={`Remove filter ${filterChipLabel(f)}`}
          >
            ×
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-1 rounded-full border border-dashed border-accent/40 bg-accent/5 px-3 py-1.5 text-xs font-semibold text-accent transition hover:border-accent hover:bg-accent/10"
      >
        + Add filter
      </button>
    </div>
  );
}
