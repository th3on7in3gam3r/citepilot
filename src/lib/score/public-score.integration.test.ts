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

  it("loads full public score page data for biblefunlandstudios.com", async () => {
    if (!process.env.DATABASE_URL?.trim() && !process.env.NEON_URL?.trim()) {
      return;
    }

    const { getPublicScorePageData } = await import("@/lib/score/public-score");
    const data = await getPublicScorePageData("biblefunlandstudios.com");
    if (!data) {
      // Domain may not be audited in this environment.
      return;
    }

    expect(data.domain).toBe("biblefunlandstudios.com");
    expect(data.audit.score).toEqual(expect.any(Number));
    expect(data.platforms.length).toBeGreaterThan(0);
  }, 30_000);
});
