import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { getSlackConnection } from "@/lib/alerts/store";
import { postSlackMessage } from "@/lib/alerts/slack-client";
import {
  buildWeeklyDigestBlocks,
  estLiftLabel,
  topFixFromAudit,
} from "@/lib/alerts/slack-blocks";
import { buildCompetitorMoveDelta } from "@/lib/audit/competitor-delta";
import type { AuditPayload } from "@/lib/api-types";
import { userHasPilotAccess } from "@/lib/billing/access";
import { getWorkspaceById } from "@/lib/server/workspace";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

function sampleAudit(domain: string): AuditPayload {
  return {
    id: "test",
    domain,
    score: 72,
    cited: 3,
    total: 5,
    gaps: ["Add FAQ schema for buyer prompts"],
    platforms: [],
    competitors: [],
    promptResults: [],
    siteSignals: {
      title: domain,
      metaDescription: "",
      h1: domain,
      wordCount: 0,
      hasJsonLd: false,
      hasFaqSchema: false,
      hasOrganizationSchema: false,
      hasOgTags: false,
      sitemapFound: false,
      robotsAllows: true,
      fetchOk: true,
      geoScore: 0,
    },
    mode: "technical",
    workspaceId: "test",
    createdAt: new Date().toISOString(),
  };
}

/**
 * POST /api/notifications/test-slack
 * Body: { workspaceId: string }
 */
export const POST = withApiLogging(async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (auth instanceof NextResponse) return auth;
  const userId = apiUserId(auth);
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  if (!(await userHasPilotAccess(userId))) {
    return NextResponse.json({ error: "Pilot or Fleet required" }, { status: 403 });
  }

  let body: { workspaceId?: string };
  try {
    body = (await request.json()) as { workspaceId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const workspaceId = body.workspaceId?.trim();
  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  }

  const ws = await getWorkspaceById(workspaceId, userId);
  if (!ws) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const slack = await getSlackConnection(workspaceId, userId);
  if (!slack?.slack_channel_id) {
    return NextResponse.json(
      { error: "Slack is not connected or no channel selected." },
      { status: 422 },
    );
  }

  const audit = ws.latestAudit ?? sampleAudit(ws.domain);
  const delta = buildCompetitorMoveDelta({
    current: audit,
    previous: null,
    trackedCompetitors: ws.competitors,
  });

  const { blocks, text } = buildWeeklyDigestBlocks({
    domain: ws.domain,
    score: audit.score,
    previousScore: audit.score - 8,
    delta,
    topFix: topFixFromAudit(audit),
    estLift: estLiftLabel(-8),
  });

  const result = await postSlackMessage({ connection: slack, blocks, text });
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? "Failed to post Slack message" },
      { status: 422 },
    );
  }

  return NextResponse.json({
    ok: true,
    channel: slack.slack_channel_name ?? slack.slack_channel_id,
  });
});
