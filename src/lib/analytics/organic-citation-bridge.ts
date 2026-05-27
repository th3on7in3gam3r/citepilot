import type { CitationHistoryPoint } from "@/lib/api-types";
import type { GscMetrics } from "@/lib/gsc/client";

export type OrganicCitationBridge = {
  available: boolean;
  headline: string;
  summary: string;
  evidence: string[];
};

export function buildOrganicCitationBridge(input: {
  citationHistory: CitationHistoryPoint[];
  citationScore: number;
  gsc: GscMetrics | null;
}): OrganicCitationBridge {
  const gsc = input.gsc;
  if (!gsc?.connected) {
    return {
      available: false,
      headline: "Connect Search Console",
      summary:
        "Link Google Search Console to compare organic clicks and impressions with your citation audit history.",
      evidence: [],
    };
  }

  const evidence: string[] = [
    `${gsc.clicks.toLocaleString()} organic clicks in the last 28 days`,
    `${gsc.impressions.toLocaleString()} impressions · avg position ${gsc.position.toFixed(1)}`,
  ];
  if (gsc.clicksDelta) {
    evidence.push(`${gsc.clicksDelta} clicks vs the prior 28-day period`);
  }
  if (gsc.impressionsDelta) {
    evidence.push(`${gsc.impressionsDelta} impressions vs the prior 28-day period`);
  }

  const history = input.citationHistory;
  if (history.length < 2) {
    return {
      available: true,
      headline: "Organic demand is live — citation trend building",
      summary:
        "Search Console is connected. Run at least two citation audits to correlate citation score movement with organic clicks and impressions.",
      evidence: [
        ...evidence,
        `Latest citation score: ${input.citationScore}/100`,
        history.length === 1
          ? "One audit saved — run another to unlock citation vs organic comparison"
          : "No citation audit history yet",
      ],
    };
  }

  const previous = history[history.length - 2]!;
  const latest = history[history.length - 1]!;
  const citationDelta = latest.visibilityIndex - previous.visibilityIndex;
  const citationDirection =
    citationDelta > 0 ? "up" : citationDelta < 0 ? "down" : "flat";
  const citationDeltaLabel =
    citationDelta === 0
      ? "unchanged"
      : `${citationDelta > 0 ? "+" : ""}${citationDelta} pts`;

  const clicksTrend = parseSignedDelta(gsc.clicksDelta);
  let alignment = "still forming";
  if (clicksTrend !== null) {
    if (
      (citationDirection === "up" && clicksTrend > 0) ||
      (citationDirection === "down" && clicksTrend < 0)
    ) {
      alignment = "moving together";
    } else if (citationDirection === "flat" && clicksTrend === 0) {
      alignment = "steady on both sides";
    } else {
      alignment = "diverging — worth investigating content and SERP pages";
    }
  }

  return {
    available: true,
    headline: `Citation score ${citationDeltaLabel}; organic clicks ${alignment}`,
    summary:
      "This view pairs saved citation audits with live Search Console performance. Use it to see whether AI citation gains are showing up alongside organic demand.",
    evidence: [
      ...evidence,
      `Citation score moved ${citationDeltaLabel} between your last two audits`,
      clicksTrend !== null
        ? `Organic clicks trend: ${clicksTrend > 0 ? "up" : clicksTrend < 0 ? "down" : "flat"} vs prior 28 days`
        : "Organic click trend unavailable for this period",
    ],
  };
}

function parseSignedDelta(delta: string | null | undefined): number | null {
  if (!delta) return null;
  const normalized = delta.replace(/,/g, "").trim();
  const match = normalized.match(/^([+-])?(\d+)/);
  if (!match) return null;
  const sign = match[1] === "-" ? -1 : 1;
  return sign * Number(match[2]);
}
