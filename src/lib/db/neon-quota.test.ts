import { describe, expect, it } from "vitest";
import {
  isNeonComputeQuotaError,
  neonDbErrorDetail,
} from "@/lib/db/query";

describe("isNeonComputeQuotaError", () => {
  it("detects Neon quota message", () => {
    expect(
      isNeonComputeQuotaError(
        new Error(
          "Your account or project has exceeded the compute time quota. Upgrade your plan to increase limits.",
        ),
      ),
    ).toBe(true);
  });

  it("detects XX000 + quota", () => {
    const err = Object.assign(new Error("quota exceeded"), { code: "XX000" });
    expect(isNeonComputeQuotaError(err)).toBe(true);
  });

  it("ignores unrelated errors", () => {
    expect(isNeonComputeQuotaError(new Error("connection refused"))).toBe(
      false,
    );
  });
});

describe("neonDbErrorDetail", () => {
  it("returns a clear ops message for quota", () => {
    expect(
      neonDbErrorDetail(
        new Error("Your account or project has exceeded the compute time quota"),
      ),
    ).toMatch(/COMPUTE_QUOTA_EXCEEDED/);
  });
});
