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
import {
  generateMoneyPrompts,
  toMoneyPromptInsertRows,
} from "@/lib/money-prompts/generate";
import { insertMoneyPrompts } from "@/lib/money-prompts/store";
import { brandFromWorkspace } from "@/lib/money-prompts/run-check";

export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({
  workspaceId: z.string().min(1),
  seedQueries: z.array(z.string().min(1).max(500)).min(1).max(10).optional(),
  countPerQuery: z.number().int().min(1).max(6).optional(),
});

const GENERATE_RATE_LIMIT = 20;

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
    `money-prompts:generate:${userId}:${clientIpFromRequest(request)}`,
    GENERATE_RATE_LIMIT,
    "Too many money prompt generations this hour. Try again later.",
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

  const prefs = workspace.preferences;
  const defaultSeeds = [
    ...(prefs.monitoredPrompts ?? []),
    workspace.buyerQuestion,
  ]
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 10);

  const seedQueries = parsed.data.seedQueries?.length
    ? parsed.data.seedQueries.map((s) => s.trim()).filter(Boolean)
    : defaultSeeds;

  if (!seedQueries.length) {
    return NextResponse.json(
      {
        error:
          "Provide seedQueries or add monitored prompts / a buyer question in Settings.",
      },
      { status: 400 },
    );
  }

  const brand = brandFromWorkspace({
    id: workspace.id,
    userId,
    domain: workspace.domain,
    description: workspace.description,
  });

  try {
    const generated = await generateMoneyPrompts({
      brand,
      seedQueries,
      countPerQuery: parsed.data.countPerQuery ?? 4,
    });
    if (!generated.length) {
      return NextResponse.json(
        { error: "Model returned no prompts. Try different seed queries." },
        { status: 502 },
      );
    }

    const rows = toMoneyPromptInsertRows(brand, userId, generated);
    const prompts = await insertMoneyPrompts(rows);
    return NextResponse.json({ data: { prompts } }, { status: 201 });
  } catch (err) {
    console.error("[money-prompts/generate]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Failed to generate money prompts. Try again shortly." },
      { status: 502 },
    );
  }
});
