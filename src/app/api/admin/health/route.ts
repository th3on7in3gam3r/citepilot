import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import { dbGet } from "@/lib/db";
import { fetchInternalHealth } from "@/lib/ops/health-status";
import { fetchSentryOpsStats } from "@/lib/observability/sentry-stats";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

export const GET = withApiLogging(async function GET(request: Request) {
  const admin = await requireAdminApi(request);
  if (admin instanceof Response) return admin;

  const health = await fetchInternalHealth();
  const sentry = await fetchSentryOpsStats(7);

  const queueDepth = await dbGet<{ count: number }>(
    `SELECT COUNT(*) AS count FROM email_sequence_queue WHERE status = 'pending'`,
  );

  const cronErrors = await dbGet<{ count: number }>(
    `SELECT COUNT(*) AS count FROM cron_dispatch_log
     WHERE status = 'error' AND created_at >= ?`,
    [new Date(Date.now() - 7 * 86400000).toISOString()],
  );

  return NextResponse.json({
    health,
    sentry,
    queueDepth: Number(queueDepth?.count ?? 0),
    cronErrors: Number(cronErrors?.count ?? 0),
  });
});
