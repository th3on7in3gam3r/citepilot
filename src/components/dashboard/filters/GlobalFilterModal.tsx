"use client";

import { usePathname, useRouter } from "next/navigation";
import { useGridFilter } from "@/components/dashboard/copilot/GridFilterProvider";
import { FilterBuilderModal } from "@/components/dashboard/filters/FilterBuilderModal";
import { useToast } from "@/components/notifications/ToastProvider";
import { filterChipLabel } from "@/lib/copilot/grid-filters";

/** Renders the filter builder on every dashboard route (not only Competitors). */
export function GlobalFilterModal() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    filters,
    filterModalOpen,
    generatingFilters,
    setFilterModalOpen,
    addFilter,
    updateFilter,
    removeFilter,
  } = useGridFilter();
  const toast = useToast();

  function handleApply() {
    setFilterModalOpen(false);
    const active = filters.filter(
      (f) => !f.generating && (f.operator === "is_empty" || f.value.trim() !== ""),
    );
    toast.success("Filters applied", {
      description:
        active.length > 0
          ? `Competitor Analysis is filtered by ${active.length} condition${active.length === 1 ? "" : "s"}: ${active.map(filterChipLabel).join(", ")}.`
          : "Showing all competitors in the analysis table.",
      action: pathname.startsWith("/dashboard/content")
        ? undefined
        : {
            label: "View table",
            onClick: () => router.push("/dashboard/competitors"),
          },
    });
    if (!pathname.startsWith("/dashboard/content")) {
      router.push("/dashboard/competitors");
    }
  }

  return (
    <FilterBuilderModal
      open={filterModalOpen}
      filters={filters}
      generating={generatingFilters}
      onClose={() => setFilterModalOpen(false)}
      onAdd={addFilter}
      onUpdate={updateFilter}
      onRemove={removeFilter}
      onApply={handleApply}
    />
  );
}
