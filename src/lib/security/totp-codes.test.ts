import { describe, expect, it } from "vitest";
import {
  formatTotpSecretForDisplay,
  generateBackupCode,
  generateBackupCodes,
  normalizeTotpToken,
} from "@/lib/security/totp-codes";

describe("totp-codes", () => {
  it("formats secrets in groups of four", () => {
    expect(formatTotpSecretForDisplay("JBSWY3DPEHPK3PXP")).toBe(
      "JBSW Y3DP EHPK 3PXP",
    );
  });

  it("generates backup codes in XXXXX-XXXXX format", () => {
    const code = generateBackupCode();
    expect(code).toMatch(/^[A-Z2-9]{5}-[A-Z2-9]{5}$/);
  });

  it("generates eight unique backup codes by default", () => {
    const codes = generateBackupCodes();
    expect(codes).toHaveLength(8);
    expect(new Set(codes).size).toBe(8);
  });

  it("normalizes TOTP tokens to six digits", () => {
    expect(normalizeTotpToken("12 3456")).toBe("123456");
    expect(normalizeTotpToken("1234567890")).toBe("123456");
  });
});
