/**
 * IMPORTANT: Browser-based scanning uses automated browser sessions
 * to access platforms that do not provide public APIs (Grok, Google AI).
 *
 * Before enabling in production:
 * - Review X.com Terms of Service (section on automated access)
 * - Review Google Terms of Service (section on automated queries)
 * - Consider adding a respectful crawl delay between scans
 * - Monitor for IP blocks and handle gracefully
 * - Consider reaching out to these platforms for official API access
 *
 * This scanner is rate-limited to 50 scans/workspace/day to be
 * respectful of platform resources.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { BillingPlan } from "@/lib/billing/types";
import {
  managedAgentConfigured,
  runManagedAgentTask,
} from "@/lib/scanners/anthropic-managed-agent";
import {
  assertBrowserScanAllowed,
  incrementBrowserScanCount,
} from "@/lib/scanners/browser-scan-usage";
import type { BrowserScanPlatformId } from "@/lib/scanners/platform-config";

/** Lazy client — validates API key presence; managed agent calls use REST helper. */
function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }
  return new Anthropic({ apiKey });
}

export type BrowserScanResult = {
  platform: BrowserScanPlatformId;
  prompt: string;
  brand_domain: string;
  cited: boolean;
  citation_text: string | null;
  full_answer: string | null;
  answer_position: "early" | "middle" | "late" | null;
  scanned_at: string;
  notes: string | null;
};

export function browserScannerConfigured(): boolean {
  return managedAgentConfigured();
}

function targetUrlForPlatform(
  platform: BrowserScanPlatformId,
  searchPrompt: string,
): string {
  if (platform === "grok") {
    return `https://x.com/search?q=${encodeURIComponent(searchPrompt)}&src=typed_query`;
  }
  return `https://www.google.com/search?q=${encodeURIComponent(searchPrompt)}`;
}

function parseAgentJson(text: string): Partial<BrowserScanResult> {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = (fenced?.[1] ?? trimmed).trim();
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end <= start) return {};
  try {
    return JSON.parse(candidate.slice(start, end + 1)) as Partial<BrowserScanResult>;
  } catch {
    return {};
  }
}

function notesIndicateBlocked(notes: string | null | undefined): boolean {
  if (!notes) return false;
  const lower = notes.toLowerCase();
  return lower.includes("captcha") || lower.includes("blocked");
}

export function isScanUnavailableNotes(notes: string | null | undefined): boolean {
  return notesIndicateBlocked(notes);
}

function upgradeSkippedResult(input: {
  platform: BrowserScanPlatformId;
  searchPrompt: string;
  brandDomain: string;
}): BrowserScanResult {
  return {
    platform: input.platform,
    prompt: input.searchPrompt,
    brand_domain: input.brandDomain,
    cited: false,
    citation_text: null,
    full_answer: null,
    answer_position: null,
    scanned_at: new Date().toISOString(),
    notes: "Browser-based scanning available on Pilot and Fleet plans",
  };
}

export async function scanWithBrowser(input: {
  platform: BrowserScanPlatformId;
  searchPrompt: string;
  brandDomain: string;
  workspaceId: string;
  plan: BillingPlan;
}): Promise<BrowserScanResult> {
  const { platform, searchPrompt, brandDomain, workspaceId, plan } = input;

  if (plan === "free") {
    return upgradeSkippedResult({ platform, searchPrompt, brandDomain });
  }

  if (!browserScannerConfigured()) {
    return {
      platform,
      prompt: searchPrompt,
      brand_domain: brandDomain,
      cited: false,
      citation_text: null,
      full_answer: null,
      answer_position: null,
      scanned_at: new Date().toISOString(),
      notes: "Browser scanner not configured (missing Anthropic agent env vars)",
    };
  }

  await assertBrowserScanAllowed(workspaceId, plan);

  // Touch client so misconfiguration fails fast when key is invalid format.
  getAnthropicClient();

  const targetUrl = targetUrlForPlatform(platform, searchPrompt);
  const agentPrompt = `Scan for citations of "${brandDomain}" in the AI-generated
answer at this URL: ${targetUrl}

Search prompt: "${searchPrompt}"
Brand domain: "${brandDomain}"
Platform: ${platform}

Return exactly one JSON object with keys:
platform, prompt, brand_domain, cited, citation_text, full_answer, answer_position, scanned_at, notes`;

  let success = false;
  let notes: string | null = null;

  try {
    const responseText = await runManagedAgentTask({ prompt: agentPrompt });
    const parsed = parseAgentJson(responseText);

    const result: BrowserScanResult = {
      platform: parsed.platform ?? platform,
      prompt: parsed.prompt ?? searchPrompt,
      brand_domain: parsed.brand_domain ?? brandDomain,
      cited: Boolean(parsed.cited),
      citation_text: parsed.citation_text ?? null,
      full_answer: parsed.full_answer ?? null,
      answer_position: parsed.answer_position ?? null,
      scanned_at: parsed.scanned_at ?? new Date().toISOString(),
      notes: parsed.notes ?? null,
    };

    success = !notesIndicateBlocked(result.notes);
    notes = result.notes;

    await incrementBrowserScanCount({
      workspaceId,
      platform,
      prompt: searchPrompt,
      success,
      notes: result.notes,
    });

    return result;
  } catch (error) {
    notes =
      error instanceof Error ? error.message : "Browser scan failed unexpectedly";
    await incrementBrowserScanCount({
      workspaceId,
      platform,
      prompt: searchPrompt,
      success: false,
      notes,
    });
    throw error;
  }
}

/** Respectful delay between sequential browser scans (ms). */
export const BROWSER_SCAN_DELAY_MS = 2_000;

export async function delayBetweenBrowserScans(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, BROWSER_SCAN_DELAY_MS));
}
