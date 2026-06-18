/** Shared platform metadata for browser vs API citation scans. */

export const BROWSER_SCAN_PLATFORM_NAMES = [
  "Grok",
  "Google AI Overviews",
] as const;

export type BrowserScanPlatformName = (typeof BROWSER_SCAN_PLATFORM_NAMES)[number];

export type BrowserScanPlatformId = "grok" | "google_ai_overview";

export const BROWSER_PLATFORM_ID_BY_NAME: Record<
  BrowserScanPlatformName,
  BrowserScanPlatformId
> = {
  Grok: "grok",
  "Google AI Overviews": "google_ai_overview",
};

export const BROWSER_PLATFORM_NAME_BY_ID: Record<
  BrowserScanPlatformId,
  BrowserScanPlatformName
> = {
  grok: "Grok",
  google_ai_overview: "Google AI Overviews",
};

export const API_SCAN_PLATFORM_NAMES = [
  "ChatGPT",
  "Perplexity",
  "Gemini",
  "DeepSeek",
] as const;

export function isBrowserScanPlatform(name: string): boolean {
  return (BROWSER_SCAN_PLATFORM_NAMES as readonly string[]).includes(name);
}

export function isApiScanPlatform(name: string): boolean {
  return (API_SCAN_PLATFORM_NAMES as readonly string[]).includes(name);
}

export const BROWSER_SCAN_DAILY_LIMIT = 50;

export const BROWSER_SCAN_MONTHLY_LIMIT: Record<"pilot" | "fleet", number> = {
  pilot: 200,
  fleet: 500,
};

/** Rough per-session estimate for Browser Use Cloud (cents). */
export const BROWSER_SCAN_COST_CENTS = 8;
