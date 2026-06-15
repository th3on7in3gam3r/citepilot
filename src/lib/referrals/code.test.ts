import { describe, expect, it } from "vitest";
import { generateReferralCode, normalizeReferralCode } from "./code";
import { REFERRAL_CODE_LENGTH } from "./constants";

describe("referral code", () => {
  it("generates 8-char uppercase alphanumeric codes", () => {
    const code = generateReferralCode();
    expect(code).toHaveLength(REFERRAL_CODE_LENGTH);
    expect(code).toMatch(/^[A-Z0-9]+$/);
  });

  it("normalizes codes case-insensitively", () => {
    expect(normalizeReferralCode("abc12345")).toBe("ABC12345");
    expect(normalizeReferralCode("  abc12345  ")).toBe("ABC12345");
    expect(normalizeReferralCode("short")).toBeNull();
    expect(normalizeReferralCode("abc1234!")).toBeNull();
  });
});
