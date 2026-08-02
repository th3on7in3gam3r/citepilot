import type { PlatformPresence } from "@/lib/api-types";

export type BadgeStyle = "flat" | "shield" | "badge";
export type BadgeTheme = "dark" | "light";

export type BadgeScoreData = {
  domain: string;
  score: number | null;
  hasAudit: boolean;
  platforms: Pick<PlatformPresence, "name" | "present">[];
};

const INK = "#070b14";
const ACCENT = "#0ea5e9";
const ACCENT_GLOW = "#22d3ee";
const CTA_AMBER = "#f59e0b";
const FONT =
  "system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif";

type Chrome = {
  fill: string;
  label: string;
  muted: string;
  stroke: string;
  logoBg: string;
  logoArrow: string;
};

function chromeFor(theme: BadgeTheme): Chrome {
  if (theme === "light") {
    return {
      fill: "#f8fafc",
      label: INK,
      muted: "#64748b",
      stroke: "#e2e8f0",
      logoBg: INK,
      logoArrow: "#ffffff",
    };
  }
  return {
    fill: INK,
    label: "#ffffff",
    muted: "#94a3b8",
    stroke: "#1e293b",
    logoBg: INK,
    logoArrow: "#ffffff",
  };
}

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

/** Inline CitePilot mark. */
function logoMark(
  x: number,
  y: number,
  size = 16,
  logoBg = INK,
  arrow = "#ffffff",
): string {
  const s = size / 40;
  return `<g transform="translate(${x},${y}) scale(${s})">
    <rect width="40" height="40" rx="10" fill="${logoBg}"/>
    <path d="M12 14.5C10.2 14.5 9 16 9 18v4c0 2 1.2 3.5 3 3.5" stroke="${ACCENT}" stroke-width="2.25" stroke-linecap="round" fill="none"/>
    <path d="M28 14.5c1.8 0 3 1.5 3 3.5v4c0 2-1.2 3.5-3 3.5" stroke="${ACCENT_GLOW}" stroke-width="2.25" stroke-linecap="round" fill="none"/>
    <path d="M20 26V14M16.5 17.5 20 14l3.5 3.5" stroke="${arrow}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </g>`;
}

function flatBadge(data: BadgeScoreData, theme: BadgeTheme): string {
  const chrome = chromeFor(theme);
  const hasScore = data.hasAudit && data.score != null;
  const rightLabel = hasScore ? String(data.score) : "Get score";
  const rightColor = hasScore ? scoreColor(data.score!) : CTA_AMBER;
  const rightSuffix = hasScore ? "/100" : "";

  const h = 28;
  const leftW = 102;
  const rightW = hasScore ? 68 : 86;
  const w = leftW + rightW;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${escapeXml(hasScore ? `GEO Score ${data.score} for ${data.domain}` : `Get your GEO Score — ${data.domain}`)}">
  <defs>
    <clipPath id="pill"><rect width="${w}" height="${h}" rx="${h / 2}"/></clipPath>
  </defs>
  <g clip-path="url(#pill)">
    <rect width="${leftW}" height="${h}" fill="${chrome.fill}"/>
    <rect x="${leftW}" width="${rightW}" height="${h}" fill="${rightColor}"/>
    <rect x="${leftW - 1}" width="2" height="${h}" fill="${ACCENT}" opacity="0.9"/>
  </g>
  ${logoMark(8, 6, 16, chrome.logoBg, chrome.logoArrow)}
  <text x="28" y="18" fill="${chrome.label}" font-family="${FONT}" font-size="11" font-weight="600">GEO Score</text>
  <text x="${leftW + rightW / 2}" y="${hasScore ? 18 : 17}" text-anchor="middle" fill="#ffffff" font-family="${FONT}" font-size="${hasScore ? 13 : 10}" font-weight="700">${escapeXml(rightLabel)}${hasScore ? `<tspan font-size="9" font-weight="600" dy="0">${rightSuffix}</tspan>` : ""}</text>
</svg>`;
}

function shieldBadge(data: BadgeScoreData, theme: BadgeTheme): string {
  const chrome = chromeFor(theme);
  const hasScore = data.hasAudit && data.score != null;
  const scoreText = hasScore ? String(data.score) : "?";
  const chip = hasScore ? scoreColor(data.score!) : CTA_AMBER;
  const w = 112;
  const h = 132;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${escapeXml(hasScore ? `GEO Score ${data.score}` : "Get your GEO Score")}">
  <path d="M56 3 L102 20 V58 C102 86 82 110 56 124 C30 110 10 86 10 58 V20 Z" fill="${chrome.fill}" stroke="${chrome.stroke}" stroke-width="1.5"/>
  <path d="M56 14 L90 28 V56 C90 78 76 96 56 108 C36 96 22 78 22 56 V28 Z" fill="${chip}"/>
  ${logoMark(41, 24, 14, INK, "#ffffff")}
  <text x="56" y="72" text-anchor="middle" fill="#ffffff" font-family="${FONT}" font-size="26" font-weight="800">${escapeXml(scoreText)}</text>
  <text x="56" y="90" text-anchor="middle" fill="#ffffff" font-family="${FONT}" font-size="8" font-weight="700" letter-spacing="0.06em" opacity="0.95">${hasScore ? "GEO SCORE" : "GET SCORE"}</text>
  <text x="56" y="118" text-anchor="middle" fill="${chrome.muted}" font-family="${FONT}" font-size="8" font-weight="600">CitePilot</text>
</svg>`;
}

function roundedBadge(data: BadgeScoreData, theme: BadgeTheme): string {
  const chrome = chromeFor(theme);
  const hasScore = data.hasAudit && data.score != null;
  const rightLabel = hasScore ? `${data.score}/100` : "Get score";
  const chip = hasScore ? scoreColor(data.score!) : CTA_AMBER;
  const w = 176;
  const h = 36;
  const chipW = hasScore ? 58 : 72;
  const chipX = w - chipW - 6;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${escapeXml(hasScore ? `GEO Score ${data.score}` : "Get your GEO Score")}">
  <rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="10" fill="${chrome.fill}" stroke="${chrome.stroke}" stroke-width="1"/>
  <rect x="0.5" y="0.5" width="3" height="${h - 1}" rx="1.5" fill="${ACCENT}"/>
  ${logoMark(10, 10, 16, chrome.logoBg, chrome.logoArrow)}
  <text x="32" y="23" fill="${chrome.label}" font-family="${FONT}" font-size="11" font-weight="600">GEO Score</text>
  <rect x="${chipX}" y="6" width="${chipW}" height="24" rx="12" fill="${chip}"/>
  <text x="${chipX + chipW / 2}" y="22" text-anchor="middle" fill="#ffffff" font-family="${FONT}" font-size="11" font-weight="700">${escapeXml(rightLabel)}</text>
</svg>`;
}

export function renderGeoBadgeSvg(
  data: BadgeScoreData,
  style: BadgeStyle = "flat",
  theme: BadgeTheme = "dark",
): string {
  const svg =
    style === "shield"
      ? shieldBadge(data, theme)
      : style === "badge"
        ? roundedBadge(data, theme)
        : flatBadge(data, theme);
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

export function parseBadgeTheme(raw: string | null): BadgeTheme {
  if (raw === "light" || raw === "dark") return raw;
  return "dark";
}
