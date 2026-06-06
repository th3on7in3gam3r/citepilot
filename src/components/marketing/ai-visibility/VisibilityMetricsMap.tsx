"use client";

import { useState } from "react";
import { aiVisibilityMetrics } from "@/lib/marketing/ai-visibility-landing";

export function VisibilityMetricsMap() {
  const [activeId, setActiveId] = useState(aiVisibilityMetrics[0]?.id ?? "");
  const active =
    aiVisibilityMetrics.find((m) => m.id === activeId) ?? aiVisibilityMetrics[0];

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="space-y-2 lg:col-span-2">
        {aiVisibilityMetrics.map((metric) => (
          <button
            key={metric.id}
            type="button"
            onClick={() => setActiveId(metric.id)}
            className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
              activeId === metric.id
                ? "border-accent bg-accent/10 text-accent"
                : "border-border bg-white text-muted hover:border-accent/30"
            }`}
          >
            <span>
              {metric.name}
              {metric.acronym && (
                <span className="ml-2 text-xs opacity-70">({metric.acronym})</span>
              )}
            </span>
            <span aria-hidden>{activeId === metric.id ? "→" : ""}</span>
          </button>
        ))}
      </div>

      {active && (
        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm lg:col-span-3">
          <h3 className="font-display text-xl font-bold text-ink">{active.name}</h3>
          <p className="mt-3 text-sm leading-relaxed text-muted">{active.definition}</p>
          <dl className="mt-6 space-y-4">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-accent">
                Tracked in workspace
              </dt>
              <dd className="mt-1 text-sm text-ink">{active.whereTracked}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-accent">
                Why it matters
              </dt>
              <dd className="mt-1 text-sm text-muted">{active.whyItMatters}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
