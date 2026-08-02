import { describe, expect, it } from "vitest";
import {
  DEFAULT_EMAIL_FROM,
  emailFromAddress,
  emailFromMisconfigurationWarning,
  emailFromUsesPlaceholderFallback,
  isPlaceholderEmailFromDomain,
  parseEmailFromAddress,
} from "@/lib/email/config";

describe("email from config", () => {
  it("parses display name and email", () => {
    expect(parseEmailFromAddress("CitePilot <alerts@getcitepilot.com>")).toEqual({
      displayName: "CitePilot",
      email: "alerts@getcitepilot.com",
      domain: "getcitepilot.com",
    });
  });

  it("detects Resend placeholder domains", () => {
    expect(isPlaceholderEmailFromDomain("yourverifieddomain.com")).toBe(true);
    expect(isPlaceholderEmailFromDomain("getcitepilot.com")).toBe(false);
  });

  it("auto-corrects placeholder EMAIL_FROM to getcitepilot.com", () => {
    const prev = process.env.EMAIL_FROM;
    process.env.EMAIL_FROM = "CitePilot <alerts@yourverifieddomain.com>";
    expect(emailFromUsesPlaceholderFallback()).toBe(true);
    expect(emailFromAddress()).toBe("CitePilot <alerts@getcitepilot.com>");
    expect(emailFromMisconfigurationWarning()).toContain("yourverifieddomain.com");
    process.env.EMAIL_FROM = prev;
  });

  it("keeps verified EMAIL_FROM unchanged", () => {
    const prev = process.env.EMAIL_FROM;
    process.env.EMAIL_FROM = DEFAULT_EMAIL_FROM;
    expect(emailFromUsesPlaceholderFallback()).toBe(false);
    expect(emailFromAddress()).toBe(DEFAULT_EMAIL_FROM);
    expect(emailFromMisconfigurationWarning()).toBeNull();
    process.env.EMAIL_FROM = prev;
  });
});
