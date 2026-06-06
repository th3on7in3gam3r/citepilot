import { describe, expect, it } from "vitest";
import {
  DASHBOARD_SEO_HUB_PATHS,
  isDashboardSeoHubPath,
} from "@/lib/dashboard-seo-hubs";

describe("isDashboardSeoHubPath", () => {
  it("includes analytics and other hub routes", () => {
    expect(isDashboardSeoHubPath("/dashboard/analytics")).toBe(true);
    expect(DASHBOARD_SEO_HUB_PATHS.includes("/dashboard")).toBe(true);
  });

  it("excludes nested non-hub routes", () => {
    expect(isDashboardSeoHubPath("/dashboard/help")).toBe(false);
    expect(isDashboardSeoHubPath("/api/workspaces")).toBe(false);
  });
});
