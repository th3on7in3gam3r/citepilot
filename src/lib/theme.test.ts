import { describe, expect, it } from "vitest";
import { isDashboardPath, resolveTheme } from "@/lib/theme";

describe("isDashboardPath", () => {
  it("matches dashboard routes", () => {
    expect(isDashboardPath("/dashboard")).toBe(true);
    expect(isDashboardPath("/dashboard/settings")).toBe(true);
    expect(isDashboardPath("/pricing")).toBe(false);
  });
});

describe("resolveTheme", () => {
  it("honors explicit preferences", () => {
    expect(resolveTheme("light", "/dashboard")).toBe("light");
    expect(resolveTheme("dark", "/")).toBe("dark");
  });

  it("defaults dashboard system preference to dark", () => {
    expect(resolveTheme("system", "/dashboard")).toBe("dark");
  });
});
