"use client";

import { useCallback, useEffect, useState } from "react";
import { geoSevenDayPlan } from "@/lib/marketing/geo-playbook";

const STORAGE_KEY = "citepilot-geo-7day-v1";

function loadCompletedDays(): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as number[]);
  } catch {
    return new Set();
  }
}

export function GeoGuideSevenDay() {
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [activeDay, setActiveDay] = useState(1);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setCompleted(loadCompletedDays());
      setHydrated(true);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const toggleDay = useCallback((day: number) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  const current = geoSevenDayPlan.find((d) => d.day === activeDay);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {geoSevenDayPlan.map((d) => {
          const done = completed.has(d.day);
          const isActive = activeDay === d.day;
          return (
            <button
              key={d.day}
              type="button"
              onClick={() => setActiveDay(d.day)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border bg-white text-muted hover:border-accent/30"
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold ${
                  done ? "bg-accent text-white" : "bg-surface text-ink"
                }`}
              >
                {done ? "✓" : d.day}
              </span>
              Day {d.day}
            </button>
          );
        })}
      </div>

      {current && (
        <article className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          <div className="border-b border-border px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">
              Day {current.day}
            </p>
            <h3 className="font-display mt-1 text-xl font-bold text-ink">
              {current.title}
            </h3>
            <p className="mt-2 text-sm text-muted">
              <strong className="text-ink">Outcome:</strong> {current.outcome}
            </p>
          </div>
          <ul className="divide-y divide-border">
            {current.tasks.map((task) => (
              <li
                key={task}
                className="flex gap-3 px-6 py-4 text-sm leading-relaxed text-muted"
              >
                <span className="mt-0.5 text-accent" aria-hidden>
                  →
                </span>
                {task}
              </li>
            ))}
          </ul>
          <div className="border-t border-border bg-surface/50 px-6 py-4">
            <button
              type="button"
              onClick={() => toggleDay(current.day)}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                completed.has(current.day)
                  ? "border border-border bg-white text-muted"
                  : "bg-accent text-white hover:opacity-95"
              }`}
            >
              {hydrated && completed.has(current.day)
                ? "Mark incomplete"
                : "Mark day complete"}
            </button>
          </div>
        </article>
      )}
    </div>
  );
}
