"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { yourSiteContext } from "@/lib/copilot/competitor-grid-data";
import {
  createFilterId,
  emptyFilter,
  isFilterPrompt,
  parseFilterPrompt,
  type GridFilterCondition,
} from "@/lib/copilot/grid-filters";

export const COMPETITOR_TABLE_ID = "competitor-analysis";
export const COMPETITOR_TABLE_LABEL = "Competitor Analysis";

type GridFilterContextValue = {
  tableId: string;
  tableLabel: string;
  filters: GridFilterCondition[];
  filterModalOpen: boolean;
  generatingFilters: boolean;
  setFilterModalOpen: (open: boolean) => void;
  setFilters: (filters: GridFilterCondition[]) => void;
  addFilter: (logic?: GridFilterCondition["logic"]) => void;
  updateFilter: (id: string, patch: Partial<GridFilterCondition>) => void;
  removeFilter: (id: string) => void;
  clearFilters: () => void;
  generateFiltersFromPrompt: (prompt: string) => Promise<GridFilterCondition[]>;
  isFilterPrompt: (prompt: string) => boolean;
};

const GridFilterContext = createContext<GridFilterContextValue | null>(null);

export function GridFilterProvider({ children }: { children: ReactNode }) {
  const { workspace } = useWorkspaceContext();
  const [filters, setFilters] = useState<GridFilterCondition[]>([]);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [generatingFilters, setGeneratingFilters] = useState(false);

  const addFilter = useCallback((logic: GridFilterCondition["logic"] = "and") => {
    setFilters((prev) => [...prev, emptyFilter(prev.length ? logic : "where")]);
  }, []);

  const updateFilter = useCallback((id: string, patch: Partial<GridFilterCondition>) => {
    setFilters((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }, []);

  const removeFilter = useCallback((id: string) => {
    setFilters((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const clearFilters = useCallback(() => setFilters([]), []);

  const generateFiltersFromPrompt = useCallback(
    async (prompt: string): Promise<GridFilterCondition[]> => {
      setGeneratingFilters(true);
      setFilterModalOpen(true);

      const placeholders: GridFilterCondition[] = [
        { ...emptyFilter("where"), id: createFilterId(), generating: true },
        { ...emptyFilter("and"), id: createFilterId(), generating: true },
        { ...emptyFilter("and"), id: createFilterId(), generating: true },
      ];
      setFilters(placeholders);

      const start = Date.now();
      await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));

      const ctx = workspace ? yourSiteContext(workspace) : undefined;
      let parsed = parseFilterPrompt(prompt, ctx);

      if (workspace?.workspaceId || workspace?.id) {
        try {
          const res = await fetch("/api/copilot/filters", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              workspaceId: workspace.workspaceId ?? workspace.id,
              prompt,
              context: ctx,
            }),
          });
          if (res.ok) {
            const data = (await res.json()) as { filters?: GridFilterCondition[] };
            if (data.filters?.length) parsed = data.filters;
          }
        } catch {
          // rule-based fallback already set
        }
      }

      const elapsed = Math.max(1, Math.round((Date.now() - start) / 1000));
      const final = parsed.map((f, i) => ({
        ...f,
        logic: i === 0 ? ("where" as const) : f.logic === "where" ? ("and" as const) : f.logic,
        generating: false,
      }));

      setFilters(final.length ? final : [emptyFilter("where")]);
      setGeneratingFilters(false);
      void elapsed;
      return final;
    },
    [workspace],
  );

  const value = useMemo(
    (): GridFilterContextValue => ({
      tableId: COMPETITOR_TABLE_ID,
      tableLabel: COMPETITOR_TABLE_LABEL,
      filters,
      filterModalOpen,
      generatingFilters,
      setFilterModalOpen,
      setFilters,
      addFilter,
      updateFilter,
      removeFilter,
      clearFilters,
      generateFiltersFromPrompt,
      isFilterPrompt,
    }),
    [
      filters,
      filterModalOpen,
      generatingFilters,
      addFilter,
      updateFilter,
      removeFilter,
      clearFilters,
      generateFiltersFromPrompt,
    ],
  );

  return (
    <GridFilterContext.Provider value={value}>{children}</GridFilterContext.Provider>
  );
}

export function useGridFilter(): GridFilterContextValue {
  const ctx = useContext(GridFilterContext);
  if (!ctx) {
    throw new Error("useGridFilter must be used within GridFilterProvider");
  }
  return ctx;
}
