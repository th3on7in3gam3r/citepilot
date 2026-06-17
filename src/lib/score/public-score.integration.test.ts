import { config } from "dotenv";
import { describe, expect, it } from "vitest";

config({ path: ".env.local" });

describe("score page data integration", () => {
  it("loads related domains without Postgres errors", async () => {
    if (!process.env.DATABASE_URL?.trim() && !process.env.NEON_URL?.trim()) {
      return;
    }

    const { dbGet } = await import("@/lib/db");
    const { getRelatedScoreDomains } = await import("@/lib/score/related-domains");

    const row = await dbGet<{ domain: string }>(
      `SELECT domain FROM audit_runs ORDER BY created_at DESC LIMIT 1`,
    );
    if (!row?.domain) return;

    await expect(getRelatedScoreDomains(row.domain)).resolves.toEqual(
      expect.any(Array),
    );
  }, 30_000);
});
