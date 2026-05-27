import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { PILOT_UPGRADE_MESSAGE, userHasPilotAccess } from "@/lib/billing/access";
import { completeCopilot } from "@/lib/copilot/complete";
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
} from "@/lib/server/workspace";

export const runtime = "nodejs";
export const maxDuration = 60;

type CopilotKind = "prioritize" | "explain-gap";

export async function POST(request: Request) {
  try {
    const user = await requireApiUser(request);
    if (user instanceof NextResponse) return user;
    const userId = apiUserId(user);

    if (!(await userHasPilotAccess(userId))) {
      return NextResponse.json(
        {
          error: PILOT_UPGRADE_MESSAGE,
          upgradeUrl: "/pricing",
          code: "PILOT_REQUIRED",
        },
        { status: 402 },
      );
    }

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

    return NextResponse.json({
      kind,
      text: result.text,
      workspaceId,
    });
  } catch (error) {
    console.error("POST /api/copilot", error);
    return NextResponse.json(
      { error: "Insight generation failed" },
      { status: 500 },
    );
  }
}
