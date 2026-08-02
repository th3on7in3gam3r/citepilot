import { describe, expect, it } from "vitest";
import {
  BROWSER_SCAN_DAILY_LIMIT,
  BROWSER_SCAN_MONTHLY_LIMIT,
  isBrowserScanPlatform,
} from "@/lib/scanners/platform-config";
import { isScanUnavailableNotes } from "@/lib/scanners/browser-scanner";

describe("platform-config", () => {
  it("identifies browser scan platforms", () => {
    expect(isBrowserScanPlatform("Grok")).toBe(true);
    expect(isBrowserScanPlatform("Google AI Overviews")).toBe(true);
    expect(isBrowserScanPlatform("ChatGPT")).toBe(false);
  });

  it("defines pilot/fleet browser limits", () => {
    expect(BROWSER_SCAN_DAILY_LIMIT).toBe(50);
    expect(BROWSER_SCAN_MONTHLY_LIMIT.pilot).toBe(200);
  });
});

describe("isScanUnavailableNotes", () => {
  it("flags captcha and blocked notes", () => {
    expect(isScanUnavailableNotes("captcha on x.com")).toBe(true);
    expect(isScanUnavailableNotes("Access blocked by Google")).toBe(true);
    expect(isScanUnavailableNotes(null)).toBe(false);
  });
});
