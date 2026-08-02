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

  it("returns a clear ops message for bad password", () => {
    expect(
      neonDbErrorDetail(
        new Error('password authentication failed for user "neondb_owner"'),
      ),
    ).toMatch(/password authentication failed/i);
  });

  it("redacts postgres URLs in driver messages", () => {
    expect(
      neonDbErrorDetail(
        new Error("connect to postgresql://user:secret@host/db failed"),
      ),
    ).not.toMatch(/secret/);
  });
});
