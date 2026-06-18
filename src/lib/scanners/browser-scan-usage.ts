import { v4 as uuidv4 } from "uuid";
import type { BillingPlan } from "@/lib/billing/types";
import { dbGet, dbRun } from "@/lib/db";
import {
  BROWSER_SCAN_COST_CENTS,
  BROWSER_SCAN_DAILY_LIMIT,
  BROWSER_SCAN_MONTHLY_LIMIT,
  type BrowserScanPlatformId,
} from "@/lib/scanners/platform-config";

export type BrowserScanUsageSummary = {
  dailyCount: number;
  dailyLimit: number;
  monthlyCount: number;
  monthlyLimit: number | null;
  plan: BillingPlan;
};

function startOfUtcDay(iso = new Date().toISOString()): string {
  const d = new Date(iso);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfUtcMonth(iso = new Date().toISOString()): string {
  const d = new Date(iso);
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function ensureBrowserScanUsageTable(): Promise<void> {
  await dbRun(`
    CREATE TABLE IF NOT EXISTS browser_scan_usage (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      platform TEXT NOT NULL,
      prompt TEXT NOT NULL,
      success INTEGER NOT NULL DEFAULT 1,
      cost_cents INTEGER NOT NULL DEFAULT ${BROWSER_SCAN_COST_CENTS},
      scanned_at TEXT NOT NULL,
      notes TEXT
    )
  `);
  await dbRun(
    `CREATE INDEX IF NOT EXISTS idx_browser_scan_usage_workspace_day
     ON browser_scan_usage(workspace_id, scanned_at)`,
  );
}

export async function getBrowserScanCountForDay(
  workspaceId: string,
  dayStart = startOfUtcDay(),
): Promise<number> {
  await ensureBrowserScanUsageTable();
  const row = await dbGet<{ c: number }>(
    `SELECT COUNT(*) as c FROM browser_scan_usage
     WHERE workspace_id = ? AND scanned_at >= ?`,
    [workspaceId, dayStart],
  );
  return row?.c ?? 0;
}

export async function getBrowserScanCountForMonth(
  workspaceId: string,
  monthStart = startOfUtcMonth(),
): Promise<number> {
  await ensureBrowserScanUsageTable();
  const row = await dbGet<{ c: number }>(
    `SELECT COUNT(*) as c FROM browser_scan_usage
     WHERE workspace_id = ? AND scanned_at >= ?`,
    [workspaceId, monthStart],
  );
  return row?.c ?? 0;
}

export async function incrementBrowserScanCount(input: {
  workspaceId: string;
  platform: BrowserScanPlatformId;
  prompt: string;
  success: boolean;
  notes?: string | null;
}): Promise<void> {
  await ensureBrowserScanUsageTable();
  await dbRun(
    `INSERT INTO browser_scan_usage (
      id, workspace_id, platform, prompt, success, cost_cents, scanned_at, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      uuidv4(),
      input.workspaceId,
      input.platform,
      input.prompt,
      input.success ? 1 : 0,
      BROWSER_SCAN_COST_CENTS,
      new Date().toISOString(),
      input.notes ?? null,
    ],
  );
}

export async function getBrowserScanUsageSummary(
  workspaceId: string,
  plan: BillingPlan,
): Promise<BrowserScanUsageSummary> {
  const [dailyCount, monthlyCount] = await Promise.all([
    getBrowserScanCountForDay(workspaceId),
    getBrowserScanCountForMonth(workspaceId),
  ]);

  const monthlyLimit =
    plan === "pilot"
      ? BROWSER_SCAN_MONTHLY_LIMIT.pilot
      : plan === "fleet"
        ? BROWSER_SCAN_MONTHLY_LIMIT.fleet
        : null;

  return {
    dailyCount,
    dailyLimit: BROWSER_SCAN_DAILY_LIMIT,
    monthlyCount,
    monthlyLimit,
    plan,
  };
}

export async function assertBrowserScanAllowed(
  workspaceId: string,
  plan: BillingPlan,
): Promise<void> {
  if (plan === "free") {
    throw new Error("Browser-based scanning requires Pilot or Fleet plan");
  }

  const summary = await getBrowserScanUsageSummary(workspaceId, plan);
  if (summary.dailyCount >= summary.dailyLimit) {
    throw new Error(
      `Daily browser scan limit reached (${summary.dailyLimit}/day)`,
    );
  }
  if (
    summary.monthlyLimit !== null &&
    summary.monthlyCount >= summary.monthlyLimit
  ) {
    throw new Error(
      `Monthly browser scan limit reached (${summary.monthlyLimit}/month)`,
    );
  }
}
