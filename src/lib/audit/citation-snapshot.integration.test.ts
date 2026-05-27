import { describe, expect, it } from "vitest";
import { v4 as uuidv4 } from "uuid";
import { dbAll, dbRun, ensureDb } from "@/lib/db";

describe("citation snapshot persistence", () => {
  it("returns history rows after audit + snapshot inserts", async () => {
    await ensureDb();
    const workspaceId = uuidv4();
    const auditId = uuidv4();
    const now = new Date().toISOString();

    await dbRun(
      `INSERT INTO workspaces (
        id, domain, business_type, description, audiences, competitors,
        buyer_question, referral, preferences, user_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        workspaceId,
        "acme.com",
        "saas",
        "Test",
        "[]",
        "[]",
        "best tool",
        "",
        "{}",
        "user-test",
        now,
        now,
      ],
    );

    await dbRun(
      `INSERT INTO audit_runs (
        id, workspace_id, domain, prompts, score, cited_count, total_prompts,
        platforms, gaps, site_signals, prompt_results, mode, trigger, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        auditId,
        workspaceId,
        "acme.com",
        '["best tool"]',
        72,
        1,
        1,
        "[]",
        "[]",
        "{}",
        "[]",
        "technical",
        "manual",
        now,
      ],
    );

    await dbRun(
      `INSERT INTO citation_snapshots (id, workspace_id, visibility_index, recorded_at)
       VALUES (?, ?, ?, ?)`,
      [uuidv4(), workspaceId, 72, now],
    );

    const rows = await dbAll<{ visibility_index: number }>(
      `SELECT visibility_index FROM citation_snapshots WHERE workspace_id = ?`,
      [workspaceId],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.visibility_index).toBe(72);
  });
});
