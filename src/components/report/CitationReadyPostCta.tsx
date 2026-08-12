"use client";

import { trackEvent } from "@/lib/analytics/track";
import { signalDeskGapPostUrl } from "@/lib/growth-stack";

export type CitationReadyPostCtaProps = {
  brand: string;
  topic?: string;
  gapSummary: string;
  surface: "proof_report" | "public_proof_report";
};

export function CitationReadyPostCta({
  brand,
  topic,
  gapSummary,
  surface,
}: CitationReadyPostCtaProps) {
  const href = signalDeskGapPostUrl({ brand, topic, gapSummary });

  function handleClick() {
    trackEvent("signaldesk_gap_cta_clicked", {
      brand,
      topic: topic?.trim() || undefined,
      surface,
      source: "citepilot",
    });
  }

  return (
    <aside
      className="citepilot-no-print mt-4 rounded-xl border border-border bg-surface px-5 py-4 print:hidden"
      aria-label="Close this citation gap on SignalDesk Blog"
    >
      <h3 className="text-sm font-semibold text-ink">
        You&apos;re not being cited here yet.
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">
        Publish a citation-ready dispatch on SignalDesk Blog to close this gap —
        answer-first content structured for ChatGPT, Perplexity, and AI Overviews
        to quote.
      </p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="mt-3 inline-flex text-sm font-semibold text-accent underline-offset-2 hover:underline"
      >
        Write a post about this →
      </a>
    </aside>
  );
}
