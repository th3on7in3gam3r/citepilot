/**
 * Unified citation scanner router.
 * API-based platforms are handled in platform-probes.ts during audits.
 * Browser-based platforms (Grok, Google AI Overviews) use scanWithBrowser.
 */

import type { BillingPlan } from "@/lib/billing/types";
import {
  scanWithBrowser,
  type BrowserScanResult,
} from "@/lib/scanners/browser-scanner";
import {
  BROWSER_PLATFORM_ID_BY_NAME,
  BROWSER_PLATFORM_NAME_BY_ID,
  type BrowserScanPlatformId,
} from "@/lib/scanners/platform-config";

export type Platform =
  | "chatgpt"
  | "perplexity"
  | "gemini"
  | "google_ai"
  | "grok"
  | "deepseek";

const PLATFORM_TO_BROWSER_ID: Partial<
  Record<Platform, BrowserScanPlatformId>
> = {
  grok: "grok",
  google_ai: "google_ai_overview",
};

const PLATFORM_TO_DISPLAY_NAME: Record<Platform, string> = {
  chatgpt: "ChatGPT",
  perplexity: "Perplexity",
  gemini: "Gemini",
  google_ai: "Google AI Overviews",
  grok: "Grok",
  deepseek: "DeepSeek",
};

export type ScanPlatformInput = {
  platform: Platform;
  prompt: string;
  brandDomain: string;
  workspaceId: string;
  plan: BillingPlan;
};

export async function scanPlatform(
  input: ScanPlatformInput,
): Promise<BrowserScanResult | { cited: boolean; platform: string }> {
  const browserId = PLATFORM_TO_BROWSER_ID[input.platform];
  if (browserId) {
    return scanWithBrowser({
      platform: browserId,
      searchPrompt: input.prompt,
      brandDomain: input.brandDomain,
      workspaceId: input.workspaceId,
      plan: input.plan,
    });
  }

  throw new Error(
    `Platform "${input.platform}" uses API scanning — run via runLivePlatformProbes instead`,
  );
}

export function displayNameForPlatform(platform: Platform): string {
  return PLATFORM_TO_DISPLAY_NAME[platform];
}

export function browserIdForPlatformName(name: string): BrowserScanPlatformId | null {
  if (name in BROWSER_PLATFORM_ID_BY_NAME) {
    return BROWSER_PLATFORM_ID_BY_NAME[
      name as keyof typeof BROWSER_PLATFORM_ID_BY_NAME
    ];
  }
  return null;
}

export function platformNameForBrowserId(id: BrowserScanPlatformId): string {
  return BROWSER_PLATFORM_NAME_BY_ID[id];
}

export { scanWithBrowser, type BrowserScanResult };
