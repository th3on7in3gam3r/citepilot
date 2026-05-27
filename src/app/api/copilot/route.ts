import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { PILOT_UPGRADE_MESSAGE, userHasPilotAccess } from "@/lib/billing/access";
import { trackServerEvent } from "@/lib/analytics/track-server";
import { completeCopilot } from "@/lib/copilot/complete";
import { captureServerException } from "@/lib/observability/sentry";
import { COPILOT_RATE_LIMIT_PER_HOUR } from "@/lib/rate-limit/constants";
import {
  checkHourlyRateLimit,
  rateLimitHeaders,
} from "@/lib/rate-limit/hourly";
import {
  buildExplainGapUserMessage,
  buildPrioritizeUserMessage,
  COPILOT_SYSTEM_PROMPT,
} from "@/lib/copilot/prompts";
import { buildCopilotContext } from "@/lib/copilot/workspace-context";
import {
  enrichSnapshotWithBacklinks,
  getWorkspaceById,
  toSnapshot,
  updateWorkspace,
} from "@/lib/server/workspace";

export const runtime = "nodejs";
export const maxDuration = 60;

type CopilotKind = "prioritize" | "explain-gap";

export async function POST(request: Request) {
  try {
    const user = await requireApiUser(request);
    if (user instanceof NextResponse) return user;
    const userId = apiUserId(user);

    const body = (await request.json()) as {
      kind?: CopilotKind;
      workspaceId?: string;
      gap?: string;
    };

    const kind = body.kind;
    if (kind !== "prioritize" && kind !== "explain-gap") {
      return NextResponse.json(
        { error: "kind must be prioritize or explain-gap" },
        { status: 400 },
      );
    }

    const workspaceId = body.workspaceId?.trim();
    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required" },
        { status: 400 },
      );
    }

    const workspace = await getWorkspaceById(workspaceId, userId);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const hasPilot = await userHasPilotAccess(userId);
    const freeTeaser =
      !hasPilot &&
      kind === "explain-gap" &&
      !workspace.preferences.freeExplainGapUsed;

    if (!hasPilot && !freeTeaser) {
      return NextResponse.json(
        {
          error: PILOT_UPGRADE_MESSAGE,
          upgradeUrl: "/pricing",
          code: "PILOT_REQUIRED",
        },
        { status: 402 },
      );
    }

    const rate = await checkHourlyRateLimit(
      `copilot:${userId}`,
      COPILOT_RATE_LIMIT_PER_HOUR,
    );
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: `CitePilot Insights limit reached (${rate.limit}/hour). Try again after ${rate.resetAt}.`,
          code: "RATE_LIMIT",
        },
        {
          status: 429,
          headers: rateLimitHeaders(rate),
        },
      );
    }

    const snapshot = await enrichSnapshotWithBacklinks(
      toSnapshot(workspace),
      workspace.id,
    );

    if (!snapshot.hasRealAudit) {
      return NextResponse.json(
        {
          error:
            "Run a citation audit first so CitePilot Insights can use your real scores and gaps.",
        },
        { status: 400 },
      );
    }

    if (kind === "explain-gap") {
      const gap = body.gap?.trim();
      if (!gap) {
        return NextResponse.json({ error: "gap is required" }, { status: 400 });
      }
    }

    const contextJson = buildCopilotContext(snapshot);
    const userMessage =
      kind === "prioritize"
        ? buildPrioritizeUserMessage(contextJson)
        : buildExplainGapUserMessage(contextJson, body.gap!.trim());

    const result = await completeCopilot(
      COPILOT_SYSTEM_PROMPT,
      userMessage,
      kind === "prioritize" ? 900 : 650,
    );

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 503 });
    }

    if (freeTeaser) {
      await updateWorkspace(
        workspaceId,
        { preferences: { freeExplainGapUsed: true } },
        userId,
      );
    }

    void trackServerEvent("insights_completed", {
      distinctId: userId ?? workspaceId,
      workspaceId,
      kind,
      teaser: freeTeaser,
    });

    return NextResponse.json(
      {
        kind,
        text: result.text,
        workspaceId,
        teaser: freeTeaser,
      },
      { headers: rateLimitHeaders(rate) },
    );
  } catch (error) {
    captureServerException(error, { route: "POST /api/copilot" });
    const detail =
      error instanceof Error ? error.message : "Unknown server error";
    console.error("POST /api/copilot", error);
    return NextResponse.json(
      {
        error: "Insight generation failed",
        code: "COPILOT_INTERNAL",
        detail:
          process.env.NODE_ENV === "development" ? detail : undefined,
      },
      { status: 500 },
    );
  }
}
