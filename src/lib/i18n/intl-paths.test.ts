import { describe, expect, it } from "vitest";
import { shouldRunIntl } from "@/lib/i18n/intl-paths";

describe("shouldRunIntl", () => {
  it("runs for localized marketing routes", () => {
    expect(shouldRunIntl("/")).toBe(true);
    expect(shouldRunIntl("/pricing")).toBe(true);
    expect(shouldRunIntl("/agency")).toBe(true);
    expect(shouldRunIntl("/es")).toBe(true);
    expect(shouldRunIntl("/es/pricing")).toBe(true);
    expect(shouldRunIntl("/fr/agency")).toBe(true);
  });

  it("skips English-only app routes so they are not rewritten to /en/*", () => {
    expect(shouldRunIntl("/feedback")).toBe(false);
    expect(shouldRunIntl("/product")).toBe(false);
    expect(shouldRunIntl("/blog")).toBe(false);
    expect(shouldRunIntl("/audit")).toBe(false);
    expect(shouldRunIntl("/changelog")).toBe(false);
  });

  it("skips dashboard and api paths", () => {
    expect(shouldRunIntl("/dashboard")).toBe(false);
    expect(shouldRunIntl("/api/health")).toBe(false);
  });
});
