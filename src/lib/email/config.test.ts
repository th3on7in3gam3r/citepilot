import { describe, expect, it } from "vitest";
import {
  emailFromMisconfigurationError,
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

  it("returns misconfiguration error for placeholder EMAIL_FROM", () => {
    const prev = process.env.EMAIL_FROM;
    process.env.EMAIL_FROM = "CitePilot <alerts@yourverifieddomain.com>";
    expect(emailFromMisconfigurationError()).toContain("yourverifieddomain.com");
    process.env.EMAIL_FROM = prev;
  });
});
