import { config } from "dotenv";
import { describe, expect, it } from "vitest";

config({ path: ".env.local" });

describe("gatherAdminOverview integration", () => {
  it("runs against configured database", async () => {
    if (!process.env.DATABASE_URL?.trim() && !process.env.NEON_URL?.trim()) {
      return;
    }

    const { gatherAdminOverview } = await import("@/lib/admin/metrics");
    await expect(gatherAdminOverview()).resolves.toMatchObject({
      plans: expect.objectContaining({ total: expect.any(Number) }),
    });
  }, 30_000);
});
