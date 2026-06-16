import type { PlatformPresence } from "@/lib/api-types";

export type BadgeStyle = "flat" | "shield" | "badge";

export type BadgeScoreData = {
  domain: string;
  score: number | null;
  hasAudit: boolean;
  platforms: Pick<PlatformPresence, "name" | "present">[];
};

const DARK = "#1a1a1a";
const CTA_AMBER = "#f59e0b";

export function scoreColor(score: number): string {
  if (score <= 40) return "#ef4444";
  if (score <= 70) return "#f59e0b";
  return "#22c55e";
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Inline CitePilot mark (16×16). */
function logoMark(x: number, y: number, size = 16): string {
  const s = size / 40;
  return `<g transform="translate(${x},${y}) scale(${s})">
    <rect width="40" height="40" rx="10" fill="#070b14"/>
    <path d="M12 14.5C10.2 14.5 9 16 9 18v4c0 2 1.2 3.5 3 3.5" stroke="#0ea5e9" stroke-width="2.25" stroke-linecap="round" fill="none"/>
    <path d="M28 14.5c1.8 0 3 1.5 3 3.5v4c0 2-1.2 3.5-3 3.5" stroke="#22d3ee" stroke-width="2.25" stroke-linecap="round" fill="none"/>
    <path d="M20 26V14M16.5 17.5 20 14l3.5 3.5" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </g>`;
}

function flatBadge(data: BadgeScoreData): string {
  const hasScore = data.hasAudit && data.score != null;
  const rightLabel = hasScore ? String(data.score) : "Get your score";
  const rightColor = hasScore ? scoreColor(data.score!) : CTA_AMBER;
  const rightSuffix = hasScore ? "/100" : "";

  const leftW = 108;
  const rightW = hasScore ? 72 : 118;
  const h = 32;
  const w = 20 + leftW + rightW;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${escapeXml(hasScore ? `GEO Score ${data.score} for ${data.domain}` : `Get your GEO Score — ${data.domain}`)}">
  ${logoMark(4, 8)}
  <rect x="20" y="0" width="${leftW}" height="${h}" rx="${h / 2}" fill="${DARK}"/>
  <rect x="${20 + leftW - 8}" y="0" width="${rightW + 8}" height="${h}" rx="${h / 2}" fill="${rightColor}"/>
  <text x="36" y="21" fill="#ffffff" font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-size="11" font-weight="600">GEO Score</text>
  <text x="${20 + leftW + (hasScore ? 14 : 10)}" y="${hasScore ? 21 : 20}" fill="#ffffff" font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-size="${hasScore ? 14 : 10}" font-weight="700">${escapeXml(rightLabel)}${hasScore ? `<tspan font-size="9" font-weight="600" dy="1">${rightSuffix}</tspan>` : ""}</text>
</svg>`;
}

function shieldBadge(data: BadgeScoreData): string {
  const hasScore = data.hasAudit && data.score != null;
  const scoreText = hasScore ? String(data.score) : "?";
  const fill = hasScore ? scoreColor(data.score!) : CTA_AMBER;
  const w = 120;
  const h = 140;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${escapeXml(hasScore ? `GEO Score ${data.score}` : "Get your GEO Score")}">
  <path d="M60 4 L110 22 V62 C110 92 88 118 60 132 C32 118 10 92 10 62 V22 Z" fill="${DARK}" stroke="#333" stroke-width="1"/>
  <path d="M60 18 L96 32 V62 C96 84 80 104 60 114 C40 104 24 84 24 62 V32 Z" fill="${fill}" opacity="0.95"/>
  ${logoMark(44, 26, 14)}
  <text x="60" y="78" text-anchor="middle" fill="#fff" font-family="system-ui,sans-serif" font-size="22" font-weight="800">${escapeXml(scoreText)}</text>
  <text x="60" y="96" text-anchor="middle" fill="#fff" font-family="system-ui,sans-serif" font-size="9" font-weight="600" opacity="0.9">${hasScore ? "GEO SCORE" : "GET SCORE"}</text>
  <text x="60" y="122" text-anchor="middle" fill="#888" font-family="system-ui,sans-serif" font-size="8" font-weight="500">CitePilot</text>
</svg>`;
}

function roundedBadge(data: BadgeScoreData): string {
  const hasScore = data.hasAudit && data.score != null;
  const rightLabel = hasScore ? `${data.score}/100` : "Get score";
  const accent = hasScore ? scoreColor(data.score!) : CTA_AMBER;
  const w = 168;
  const h = 36;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${escapeXml(hasScore ? `GEO Score ${data.score}` : "Get your GEO Score")}">
  <rect x="0" y="0" width="${w}" height="${h}" rx="8" fill="${DARK}" stroke="#333" stroke-width="1"/>
  ${logoMark(6, 10, 14)}
  <text x="28" y="23" fill="#fff" font-family="system-ui,sans-serif" font-size="11" font-weight="600">GEO Score</text>
  <rect x="98" y="6" width="64" height="24" rx="12" fill="${accent}"/>
  <text x="130" y="22" text-anchor="middle" fill="#fff" font-family="system-ui,sans-serif" font-size="11" font-weight="700">${escapeXml(rightLabel)}</text>
</svg>`;
}

export function renderGeoBadgeSvg(
  data: BadgeScoreData,
  style: BadgeStyle = "flat",
): string {
  const svg =
    style === "shield"
      ? shieldBadge(data)
      : style === "badge"
        ? roundedBadge(data)
        : flatBadge(data);
  return svg.trim();
}

export function widgetPlatformSummary(
  platforms: Pick<PlatformPresence, "name" | "present">[],
  limit = 2,
): { name: string; cited: boolean }[] {
  const wanted = [
    "ChatGPT",
    "Perplexity",
    "Google AI Overviews",
    "Gemini",
  ].slice(0, Math.max(1, limit));
  return wanted.map((name) => {
    const row = platforms.find((p) => p.name === name);
    return { name, cited: row?.present ?? false };
  });
}

export function parseBadgeStyle(raw: string | null): BadgeStyle {
  if (raw === "shield" || raw === "badge" || raw === "flat") return raw;
  return "flat";
}
