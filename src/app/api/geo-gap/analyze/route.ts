import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/auth/api";
import { requireWorkspaceAccess } from "@/lib/auth/workspace-access";
import {
  PILOT_UPGRADE_MESSAGE,
  userHasPilotAccess,
} from "@/lib/billing/access";
import { withApiLogging } from "@/lib/observability/api-log";
import {
  clientIpFromRequest,
  enforceHourlyRateLimit,
} from "@/lib/rate-limit/request";
import { getWorkspaceById } from "@/lib/server/workspace";
import { analyzeCitationGap } from "@/lib/money-prompts/analyze-gap";
import { insertCitationGaps } from "@/lib/money-prompts/store";
import { brandFromWorkspace } from "@/lib/money-prompts/run-check";

export const runtime = "nodejs";
export const maxDuration = 120;

const bodySchema = z.object({
  workspaceId: z.string().min(1),
  queries: z.array(z.string().min(1).max(500)).min(1).max(20),
  persistGaps: z.boolean().optional(),
});

export const POST = withApiLogging(async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (auth instanceof NextResponse) return auth;
  const userId = auth.userId;
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  if (!(await userHasPilotAccess(userId))) {
    return NextResponse.json({ error: PILOT_UPGRADE_MESSAGE }, { status: 403 });
  }

  const rate = await enforceHourlyRateLimit(
    `geo-gap:analyze:${userId}:${clientIpFromRequest(request)}`,
    10,
    "Too many gap analyses this hour. Try again later.",
  );
  if (rate instanceof NextResponse) return rate;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const access = await requireWorkspaceAccess(
    userId,
    parsed.data.workspaceId,
    "editor",
  );
  if (!access) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const workspace = await getWorkspaceById(parsed.data.workspaceId, userId);
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const brand = brandFromWorkspace({
    id: workspace.id,
    userId,
    domain: workspace.domain,
    description: workspace.description,
  });

  const perQuery: Array<{
    query: string;
    results: Awaited<ReturnType<typeof analyzeCitationGap>>;
  }> = [];

  for (const query of parsed.data.queries) {
    const results = await analyzeCitationGap({ brand, query: query.trim() });
    perQuery.push({ query: query.trim(), results });
  }

  const persist = parsed.data.persistGaps !== false;
  let gapsOpened = 0;
  if (persist) {
    const gapRows = perQuery.flatMap(({ query, results }) =>
      results
        .filter((r) => !r.brandCited && r.gapReason)
        .map((r) => ({
          workspaceId: workspace.id,
          userId,
          moneyPromptId: null as string | null,
          query,
          engine: r.engine,
          brandCited: false,
          competitorsCited: r.competitorsCited,
          gapReason: r.gapReason,
          suggestedFix: r.suggestedFix || null,
          priority: r.priority,
          status: "open" as const,
        })),
    );
    if (gapRows.length > 0) {
      await insertCitationGaps(gapRows);
      gapsOpened = gapRows.length;
    }
  }

  return NextResponse.json({
    data: { queries: perQuery, gapsOpened },
  });
});
