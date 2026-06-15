"use client";

import { useCallback, useEffect, useState } from "react";
import {
  buildFullPlaybookChecklist,
  type GeoChecklistItem,
} from "@/lib/marketing/geo-playbook";

const STORAGE_KEY = "citepilot-geo-checklist-v2";

const playbookChecklist = buildFullPlaybookChecklist();

function loadChecked(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function groupByCategory(items: GeoChecklistItem[]) {
  const map = new Map<string, GeoChecklistItem[]>();
  for (const item of items) {
    const list = map.get(item.category) ?? [];
    list.push(item);
    map.set(item.category, list);
  }
  return [...map.entries()];
}

export function GeoGuideChecklist() {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setChecked(loadChecked());
      setHydrated(true);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const toggle = useCallback((id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  const total = playbookChecklist.length;
  const done = [...checked].filter((id) =>
    playbookChecklist.some((item) => item.id === id),
  ).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const groups = groupByCategory(playbookChecklist);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">
              Interactive checklist
            </p>
            <p className="font-display mt-1 text-2xl font-bold text-ink">
              {hydrated ? `${done} of ${total}` : "—"} items complete
            </p>
          </div>
          <p className="text-sm text-muted">
            Progress saves in your browser · {pct}% done
          </p>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {groups.map(([category, items]) => (
        <div
          key={category}
          className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
        >
          <div className="border-b border-border bg-surface px-5 py-3">
            <h3 className="font-display text-sm font-bold text-ink">{category}</h3>
          </div>
          <ul className="divide-y divide-border">
            {items.map((item) => {
              const isChecked = checked.has(item.id);
              return (
                <li key={item.id}>
                  <label className="flex cursor-pointer gap-4 px-5 py-4 transition hover:bg-surface/60">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggle(item.id)}
                      className="mt-1 h-4 w-4 shrink-0 rounded border-border text-accent focus:ring-accent"
                    />
                    <span className="min-w-0">
                      <span
                        className={`block text-sm font-medium ${isChecked ? "text-muted line-through" : "text-ink"}`}
                      >
                        {item.label}
                      </span>
                      <span className="mt-1 block text-xs leading-relaxed text-muted">
                        {item.detail}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
