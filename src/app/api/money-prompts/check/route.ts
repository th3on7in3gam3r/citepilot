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
import { getMoneyPromptById } from "@/lib/money-prompts/store";
import { runMoneyPromptCheck } from "@/lib/money-prompts/run-check";

export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({
  promptId: z.string().min(1),
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
    `money-prompts:check:${userId}:${clientIpFromRequest(request)}`,
    30,
    "Too many citation checks this hour. Try again later.",
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

  const prompt = await getMoneyPromptById(parsed.data.promptId);
  if (!prompt) {
    return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
  }

  const access = await requireWorkspaceAccess(
    userId,
    prompt.workspaceId,
    "editor",
  );
  if (!access) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const result = await runMoneyPromptCheck(parsed.data.promptId);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    data: {
      prompt: result.prompt,
      results: result.results,
      gapsOpened: result.gapsOpened,
    },
  });
});
