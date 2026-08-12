import { describe, expect, it } from "vitest";
import {
  isNeonQuotaAuthError,
  mapAuthSignInError,
} from "@/lib/auth/user-facing-errors";

describe("mapAuthSignInError", () => {
  it("maps Neon data-transfer quota DATABASE_ERROR payloads", () => {
    const err = {
      status: 500,
      message: "Your project has exceeded the data transfer quota. Upgrade your plan to increase limits.",
      code: "DATABASE_ERROR",
      cause: {
        code: "53000",
        message: "Your project has exceeded the data transfer quota. Upgrade your plan to increase limits.",
      },
    };
    expect(isNeonQuotaAuthError(err)).toBe(true);
    expect(mapAuthSignInError(err)).toMatch(/Neon usage quota/i);
  });

  it("maps rate limits before the generic fallback", () => {
    expect(mapAuthSignInError({ status: 429, message: "Too many requests" })).toMatch(
      /rate-limited/i,
    );
  });

  it("maps 404 misconfiguration", () => {
    expect(mapAuthSignInError({ status: 404, message: "endpoint not found" })).toMatch(
      /misconfigured/i,
    );
  });

  it("returns the provided fallback for unknown errors", () => {
    expect(mapAuthSignInError(new Error("boom"), "Custom fallback")).toBe(
      "Custom fallback",
    );
  });
});
