"use client";

import { useState } from "react";
import { aeoVsGeoPrinciples } from "@/lib/marketing/ai-visibility-landing";

type View = "compare" | "aeo" | "geo" | "citepilot";

const views: { id: View; label: string }[] = [
  { id: "compare", label: "Side by side" },
  { id: "aeo", label: "AEO focus" },
  { id: "geo", label: "GEO focus" },
  { id: "citepilot", label: "CitePilot" },
];

export function AeoGeoCompare() {
  const [view, setView] = useState<View>("compare");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="AEO vs GEO views">
        {views.map((v) => (
          <button
            key={v.id}
            type="button"
            role="tab"
            aria-selected={view === v.id}
            onClick={() => setView(v.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              view === v.id
                ? "bg-accent text-white"
                : "border border-border bg-white text-muted hover:border-accent/40"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="px-4 py-3 font-display font-bold text-ink">Dimension</th>
              {(view === "compare" || view === "aeo") && (
                <th className="px-4 py-3 font-display font-bold text-ink">AEO</th>
              )}
              {(view === "compare" || view === "geo") && (
                <th className="px-4 py-3 font-display font-bold text-ink">GEO</th>
              )}
              {(view === "compare" || view === "citepilot") && (
                <th className="px-4 py-3 font-display font-bold text-accent">
                  CitePilot
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-muted">
            {aeoVsGeoPrinciples.map((row) => (
              <tr key={row.dimension} className="hover:bg-surface/40">
                <td className="px-4 py-3 font-medium text-ink">{row.dimension}</td>
                {(view === "compare" || view === "aeo") && (
                  <td className="px-4 py-3">{row.aeo}</td>
                )}
                {(view === "compare" || view === "geo") && (
                  <td className="px-4 py-3">{row.geo}</td>
                )}
                {(view === "compare" || view === "citepilot") && (
                  <td className="px-4 py-3 text-ink">{row.citePilot}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
