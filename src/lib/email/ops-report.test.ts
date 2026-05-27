import { describe, expect, it } from "vitest";
import { v4 as uuidv4 } from "uuid";
import { dbRun, ensureDb } from "@/lib/db";
import { gatherOpsReportStats } from "@/lib/email/ops-report";

describe("gatherOpsReportStats", () => {
  it("counts new workspaces and audits in range", async () => {
    await ensureDb();
    const now = new Date().toISOString();
    const wsId = uuidv4();

    await dbRun(
      `INSERT INTO workspaces (
        id, domain, business_type, description, audiences, competitors,
        buyer_question, referral, preferences, user_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        wsId,
        "stats-test.com",
        "saas",
        "",
        "[]",
        "[]",
        "q",
        "",
        "{}",
        "user-stats",
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
        uuidv4(),
        wsId,
        "stats-test.com",
        "[]",
        80,
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

    const stats = await gatherOpsReportStats(7);
    expect(stats.newWorkspaces).toBeGreaterThanOrEqual(1);
    expect(stats.auditsTotal).toBeGreaterThanOrEqual(1);
    expect(stats.auditsManual).toBeGreaterThanOrEqual(1);
  });
});
