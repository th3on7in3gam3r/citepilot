"use client";

import { useEffect, useState } from "react";

const API_STEPS = [
  "Running API scans (ChatGPT, Perplexity)…",
  "Checking Google AI Overviews via Serper…",
  "Analyzing on-site GEO signals…",
];

const BROWSER_STEPS = [
  "Running API scans (ChatGPT, Perplexity)…",
  "Scanning Grok… (browser scan, ~30s)",
  "Scanning Google AI Overview… (browser scan, ~30s)",
  "Finalizing citation results…",
];

type GeoAuditScanProgressProps = {
  /** When true, show browser-scan progress messages (Pilot/Fleet). */
  includesBrowserScans?: boolean;
};

export function GeoAuditScanProgress({
  includesBrowserScans = false,
}: GeoAuditScanProgressProps) {
  const steps = includesBrowserScans ? BROWSER_STEPS : API_STEPS;
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((i) => (i + 1) % steps.length);
    }, includesBrowserScans ? 8_000 : 5_000);
    return () => clearInterval(interval);
  }, [includesBrowserScans, steps.length]);

  return (
    <div className="mt-4">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
        <div
          className={`h-full rounded-full bg-accent ${
            includesBrowserScans ? "animate-[pulse_2s_ease-in-out_infinite]" : "animate-pulse"
          }`}
          style={{ width: includesBrowserScans ? "45%" : "60%" }}
        />
      </div>
      <p className="mt-2 text-xs text-muted">{steps[stepIndex]}</p>
      {includesBrowserScans && (
        <p className="mt-1 text-[11px] text-muted/80">
          Browser scans take ~20–30 seconds each — API scans finish in ~2–5 seconds.
        </p>
      )}
    </div>
  );
}
