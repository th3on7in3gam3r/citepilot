import { NextResponse } from "next/server";
import { optionalApiUser } from "@/lib/auth/api";
import { getUserDaysActive } from "@/lib/feedback/store";
import { dbGet } from "@/lib/db";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

export const GET = withApiLogging(async function GET(request: Request) {
  const { userId } = await optionalApiUser(request);
  if (!userId) {
    return NextResponse.json({ daysActive: 0, workspaceCount: 0 });
  }

  const daysActive = await getUserDaysActive(userId);
  const row = await dbGet<{ count: number }>(
    `SELECT COUNT(*) AS count FROM workspaces WHERE user_id = ?`,
    [userId],
  );

  return NextResponse.json({
    daysActive,
    workspaceCount: row?.count ?? 0,
  });
});
