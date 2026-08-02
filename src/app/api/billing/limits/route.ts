import { NextResponse } from "next/server";
import { optionalApiUser } from "@/lib/auth/api";
import { workspaceLimitMessage } from "@/lib/billing/limits";
import { promptLimitMessage } from "@/lib/billing/prompt-limits";
import {
  getPromptLimitsForUser,
  getWorkspaceLimitsForUser,
} from "@/lib/billing/limits-server";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

export const GET = withApiLogging(async function GET(request: Request) {
  try {
    const { userId } = await optionalApiUser(request);

    const [workspaceLimits, promptLimits] = await Promise.all([
      getWorkspaceLimitsForUser(userId),
      getPromptLimitsForUser(userId, 0),
    ]);

    return NextResponse.json({
      workspace: workspaceLimits,
      prompts: promptLimits,
      copy: {
        workspace: workspaceLimitMessage(workspaceLimits),
        prompts: promptLimitMessage(promptLimits),
      },
    });
  } catch (error) {
    console.error("GET /api/billing/limits", error);
    return NextResponse.json({ error: "Could not load limits" }, { status: 500 });
  }
});
