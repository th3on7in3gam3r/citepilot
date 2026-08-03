import { afterEach, describe, expect, it, vi } from "vitest";
import {
  campaignCode,
  campaignEndsAt,
  isCampaignActive,
  isCampaignEnabled,
} from "@/lib/campaign/config";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("campaign config", () => {
  it("is disabled by default", () => {
    vi.stubEnv("CAMPAIGN_ENABLED", "");
    expect(isCampaignEnabled()).toBe(false);
    expect(isCampaignActive()).toBe(false);
  });

  it("is active when enabled with no end date", () => {
    vi.stubEnv("CAMPAIGN_ENABLED", "true");
    vi.stubEnv("CAMPAIGN_CODE", "geo2026");
    expect(isCampaignEnabled()).toBe(true);
    expect(campaignCode()).toBe("GEO2026");
    expect(isCampaignActive(new Date("2026-06-01T12:00:00.000Z"))).toBe(true);
  });

  it("is inactive when past CAMPAIGN_ENDS_AT", () => {
    vi.stubEnv("CAMPAIGN_ENABLED", "1");
    vi.stubEnv("CAMPAIGN_ENDS_AT", "2026-06-01T00:00:00.000Z");
    expect(campaignEndsAt()?.toISOString()).toBe("2026-06-01T00:00:00.000Z");
    expect(isCampaignActive(new Date("2026-06-02T00:00:00.000Z"))).toBe(false);
    expect(isCampaignActive(new Date("2026-05-31T23:00:00.000Z"))).toBe(true);
  });

  it("soft-fails on invalid end date (treats as no end)", () => {
    vi.stubEnv("CAMPAIGN_ENABLED", "true");
    vi.stubEnv("CAMPAIGN_ENDS_AT", "not-a-date");
    expect(campaignEndsAt()).toBeNull();
    expect(isCampaignActive()).toBe(true);
  });
});
