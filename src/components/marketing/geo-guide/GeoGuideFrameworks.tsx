"use client";

import { useState } from "react";
import { geoFrameworks } from "@/lib/marketing/geo-playbook";

export function GeoGuideFrameworks() {
  const [activeId, setActiveId] = useState(geoFrameworks[0]?.id ?? "");

  const active = geoFrameworks.find((f) => f.id === activeId) ?? geoFrameworks[0];

  return (
    <div className="space-y-6">
      <div
        role="tablist"
        aria-label="GEO frameworks"
        className="flex flex-wrap gap-2"
      >
        {geoFrameworks.map((fw) => (
          <button
            key={fw.id}
            type="button"
            role="tab"
            aria-selected={activeId === fw.id}
            onClick={() => setActiveId(fw.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeId === fw.id
                ? "bg-accent text-white shadow-sm"
                : "border border-border bg-white text-muted hover:border-accent/40 hover:text-ink"
            }`}
          >
            {fw.acronym}
          </button>
        ))}
      </div>

      {active && (
        <article
          role="tabpanel"
          className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
        >
          <div className="border-b border-border bg-gradient-to-r from-ink to-accent/80 px-6 py-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/60">
              {active.acronym} framework
            </p>
            <h3 className="font-display mt-1 text-xl font-bold sm:text-2xl">
              {active.name}
            </h3>
            <p className="mt-2 text-sm text-white/80">{active.tagline}</p>
          </div>
          <div className="grid gap-4 p-6 sm:grid-cols-2">
            {active.pillars.map((pillar) => (
              <div
                key={pillar.label}
                className="rounded-xl border border-border bg-surface/60 p-4"
              >
                <h4 className="font-display text-sm font-bold text-accent">
                  {pillar.label}
                </h4>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {pillar.body}
                </p>
              </div>
            ))}
          </div>
          <p className="border-t border-border bg-accent/5 px-6 py-4 text-sm text-muted">
            <strong className="text-ink">Apply when:</strong> {active.applyWhen}
          </p>
        </article>
      )}
    </div>
  );
}
