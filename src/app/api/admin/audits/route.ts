import { NextResponse } from "next/server";
import { dbAll } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin/auth";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

export const GET = withApiLogging(async function GET(request: Request) {
  const admin = await requireAdminApi(request);
  if (admin instanceof Response) return admin;

  const limit = Math.min(
    Number(new URL(request.url).searchParams.get("limit") ?? 50),
    200,
  );

  const rows = await dbAll<{
    id: string;
    domain: string;
    workspace_id: string | null;
    score: number;
    cited_count: number;
    total_prompts: number;
    mode: string;
    created_at: string;
    site_signals: string;
  }>(
    `SELECT id, domain, workspace_id, score, cited_count, total_prompts, mode, created_at, site_signals
     FROM audit_runs ORDER BY created_at DESC LIMIT ?`,
    [limit],
  );

  const audits = rows.map((row) => {
    let fetchOk = true;
    try {
      const signals = JSON.parse(row.site_signals) as { fetchOk?: boolean };
      fetchOk = signals.fetchOk !== false;
    } catch {
      fetchOk = true;
    }
    return {
      id: row.id,
      domain: row.domain,
      workspaceId: row.workspace_id,
      score: row.score,
      cited: row.cited_count,
      total: row.total_prompts,
      mode: row.mode,
      status: fetchOk ? "completed" : "site_fetch_failed",
      createdAt: row.created_at,
    };
  });

  return NextResponse.json({ audits });
});
