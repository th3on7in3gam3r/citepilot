"use client";

import { useState } from "react";
import {
  auditDiagnosticPhases,
  auditEngineDiagnostics,
} from "@/lib/marketing/audit-landing";

export function AuditDiagnosticExplorer() {
  const [activePhase, setActivePhase] = useState(auditDiagnosticPhases[0]?.id ?? "");
  const [showEngines, setShowEngines] = useState(false);

  const phase =
    auditDiagnosticPhases.find((p) => p.id === activePhase) ??
    auditDiagnosticPhases[0];

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">
          60-second engine diagnostic
        </p>
        <h2 className="font-display mt-2 text-xl font-bold text-ink sm:text-2xl">
          What runs when you click &ldquo;Run citation audit&rdquo;
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Five parallel phases complete in about a minute — site fetch, schema
          diagnostic, live AI probes, platform map, and gap report. Select a
          phase to see outputs.
        </p>

        <div className="mt-6 flex gap-1 overflow-x-auto pb-1">
          {auditDiagnosticPhases.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setActivePhase(p.id)}
              className={`flex min-w-[4.5rem] flex-col items-center rounded-xl px-2 py-3 text-center transition ${
                activePhase === p.id
                  ? "bg-accent text-white"
                  : "bg-surface text-muted hover:bg-accent/10 hover:text-accent"
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wide opacity-80">
                {p.seconds}
              </span>
              <span className="mt-1 text-lg font-bold">{i + 1}</span>
            </button>
          ))}
        </div>

        {phase && (
          <div className="mt-6 rounded-xl border border-border bg-surface/50 p-5">
            <h3 className="font-display font-bold text-ink">{phase.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{phase.body}</p>
            <ul className="mt-4 space-y-2">
              {phase.outputs.map((out) => (
                <li key={out} className="flex gap-2 text-sm text-muted">
                  <span className="text-accent" aria-hidden>
                    →
                  </span>
                  {out}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setShowEngines(!showEngines)}
          className="flex w-full items-center justify-between px-6 py-4 text-left"
          aria-expanded={showEngines}
        >
          <span>
            <span className="font-display block font-bold text-ink">
              8 AI engines in every audit
            </span>
            <span className="mt-0.5 block text-xs text-muted">
              3 live probes + 5 GEO-informed inference layers
            </span>
          </span>
          <span className="text-accent" aria-hidden>
            {showEngines ? "−" : "+"}
          </span>
        </button>
        {showEngines && (
          <ul className="divide-y divide-border border-t border-border">
            {auditEngineDiagnostics.map((engine) => (
              <li
                key={engine.name}
                className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <span className="font-medium text-ink">{engine.name}</span>
                  {engine.provider && (
                    <span className="ml-2 text-xs text-muted">via {engine.provider}</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      engine.mode === "live"
                        ? "bg-mint/15 text-mint"
                        : "bg-surface text-muted"
                    }`}
                  >
                    {engine.mode === "live" ? "Live probe" : "Inferred"}
                  </span>
                  <span className="max-w-xs text-xs text-muted sm:text-right">
                    {engine.checks}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
