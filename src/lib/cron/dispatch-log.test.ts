import { describe, expect, it, vi, beforeEach } from "vitest";

const dbGet = vi.fn();

vi.mock("@/lib/db", () => ({
  dbGet: (...args: unknown[]) => dbGet(...args),
  dbRun: vi.fn(),
}));

describe("wasCronDispatched", () => {
  beforeEach(() => {
    dbGet.mockReset();
    dbGet.mockResolvedValue(undefined);
  });

  it("uses equality for non-null workspace ids (Postgres-safe)", async () => {
    const { wasCronDispatched } = await import("@/lib/cron/dispatch-log");
    await wasCronDispatched("weekly-digest", "ws_1", "weekly-digest:2026-08-03");
    expect(dbGet).toHaveBeenCalledWith(
      expect.stringContaining("workspace_id = ?"),
      ["weekly-digest", "ws_1", "weekly-digest:2026-08-03"],
    );
    expect(dbGet.mock.calls[0]![0]).not.toMatch(/workspace_id IS \?/);
  });

  it("uses IS NULL when workspace id is null", async () => {
    const { wasCronDispatched } = await import("@/lib/cron/dispatch-log");
    await wasCronDispatched("weekly-ops-report", null, "weekly-ops-report:2026-08-03");
    expect(dbGet).toHaveBeenCalledWith(
      expect.stringContaining("workspace_id IS NULL"),
      ["weekly-ops-report", "weekly-ops-report:2026-08-03"],
    );
  });
});
