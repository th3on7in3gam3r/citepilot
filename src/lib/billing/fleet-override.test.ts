import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/server", () => ({
  getSessionUser: vi.fn(),
}));

import { isFleetOverrideEmail } from "@/lib/billing/fleet-override";

describe("fleet-override", () => {
  const prev = process.env.FLEET_OVERRIDE_EMAILS;

  afterEach(() => {
    if (prev === undefined) delete process.env.FLEET_OVERRIDE_EMAILS;
    else process.env.FLEET_OVERRIDE_EMAILS = prev;
  });

  beforeEach(() => {
    delete process.env.FLEET_OVERRIDE_EMAILS;
  });

  it("matches hardcoded QA email case-insensitively", () => {
    expect(isFleetOverrideEmail("jerlessm@gmail.com")).toBe(true);
    expect(isFleetOverrideEmail("JerlessM@Gmail.com")).toBe(true);
  });

  it("rejects unrelated emails", () => {
    expect(isFleetOverrideEmail("other@example.com")).toBe(false);
    expect(isFleetOverrideEmail(null)).toBe(false);
    expect(isFleetOverrideEmail("")).toBe(false);
  });

  it("accepts env allowlist emails", () => {
    process.env.FLEET_OVERRIDE_EMAILS = "qa@citepilot.com, demo@test.io";
    expect(isFleetOverrideEmail("qa@citepilot.com")).toBe(true);
    expect(isFleetOverrideEmail("demo@test.io")).toBe(true);
  });
});
