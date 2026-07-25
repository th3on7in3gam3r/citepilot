import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/auth/api";
import { requireWorkspaceAccess } from "@/lib/auth/workspace-access";
import {
  PILOT_UPGRADE_MESSAGE,
  userHasPilotAccess,
} from "@/lib/billing/access";
import { getBillingByUserId } from "@/lib/billing/store";
import { applyPromptLimit } from "@/lib/billing/prompt-limits";
import type { BillingPlan } from "@/lib/billing/types";
import { withApiLogging } from "@/lib/observability/api-log";
import {
  clientIpFromRequest,
  enforceHourlyRateLimit,
} from "@/lib/rate-limit/request";
import { getWorkspaceById, updateWorkspace } from "@/lib/server/workspace";
import {
  generateMoneyPrompts,
  toMoneyPromptInsertRows,
} from "@/lib/money-prompts/generate";
import { buildDefaultSeedQueries } from "@/lib/money-prompts/seeds";
import { brandFromWorkspace } from "@/lib/money-prompts/run-check";
import { runMoneyPromptCheck } from "@/lib/money-prompts/run-check";
import {
  insertMoneyPrompts,
  listCitationGaps,
  listMoneyPrompts,
  updateMoneyPromptStatus,
} from "@/lib/money-prompts/store";
import type { MoneyPrompt } from "@/lib/money-prompts/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const bodySchema = z.object({
  workspaceId: z.string().min(1),
  generate: z.boolean().optional(),
  check: z.boolean().optional(),
  promptIds: z.array(z.string().min(1)).max(40).optional(),
  countPerQuery: z.number().int().min(1).max(6).optional(),
  domain: z.string().min(1).max(255).optional(),
  activate: z.boolean().optional(),
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
    `money-prompts:run-flow:${userId}:${clientIpFromRequest(request)}`,
    15,
    "Too many money prompt flow runs this hour. Try again later.",
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

  const { workspaceId, generate, check, promptIds, countPerQuery, domain, activate } =
    parsed.data;

  const access = await requireWorkspaceAccess(userId, workspaceId, "editor");
  if (!access) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  let workspace = await getWorkspaceById(workspaceId, userId);
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  if (domain?.trim()) {
    const clean = domain
      .trim()
      .replace(/^https?:\/\//i, "")
      .replace(/\/.*$/, "")
      .toLowerCase();
    if (clean && clean !== workspace.domain.toLowerCase()) {
      await updateWorkspace(workspaceId, { domain: clean }, userId);
      workspace = (await getWorkspaceById(workspaceId, userId)) ?? workspace;
    }
  }

  let prompts: MoneyPrompt[] = await listMoneyPrompts(workspaceId);
  let generatedCount = 0;
  let checkedCount = 0;
  let gapsOpened = 0;
  const checkErrors: string[] = [];

  if (generate) {
    const brand = brandFromWorkspace({
      id: workspace.id,
      userId,
      domain: workspace.domain,
      description: workspace.description,
    });
    const seedQueries = buildDefaultSeedQueries(workspace);
    if (!seedQueries.length) {
      return NextResponse.json(
        { error: "Workspace needs a domain or description to auto-generate prompts." },
        { status: 400 },
      );
    }
    try {
      const generated = await generateMoneyPrompts({
        brand,
        seedQueries,
        countPerQuery: countPerQuery ?? 3,
      });
      if (generated.length) {
        const rows = toMoneyPromptInsertRows(brand, userId, generated);
        const inserted = await insertMoneyPrompts(rows);
        generatedCount = inserted.length;
        prompts = await listMoneyPrompts(workspaceId);
      }
    } catch (err) {
      console.error("[money-prompts/run-flow] generate", err instanceof Error ? err.message : err);
      return NextResponse.json(
        { error: "Failed to generate money prompts." },
        { status: 502 },
      );
    }
  }

  const idsToProcess =
    promptIds?.length
      ? promptIds
      : prompts.filter((p) => p.status === "draft").map((p) => p.id);

  if (activate !== false && idsToProcess.length > 0) {
    const billing = await getBillingByUserId(userId);
    const plan = (billing?.plan ?? "free") as BillingPlan;
    let monitored = [...(workspace.preferences.monitoredPrompts ?? [])];

    for (const id of idsToProcess) {
      const prompt = prompts.find((p) => p.id === id);
      if (!prompt) continue;
      await updateMoneyPromptStatus(id, "active");
      if (!monitored.includes(prompt.promptText)) {
        monitored.push(prompt.promptText);
      }
    }
    const limited = applyPromptLimit(monitored, plan);
    await updateWorkspace(
      workspaceId,
      { preferences: { monitoredPrompts: limited.prompts } },
      userId,
    );
    prompts = await listMoneyPrompts(workspaceId);
  }

  if (check) {
    const toCheck =
      promptIds?.length
        ? promptIds
        : prompts
            .filter((p) => p.status === "active" || p.status === "cited")
            .slice(0, 20)
            .map((p) => p.id);

    for (const id of toCheck) {
      const result = await runMoneyPromptCheck(id);
      if ("error" in result) {
        checkErrors.push(result.error);
        continue;
      }
      checkedCount += 1;
      gapsOpened += result.gapsOpened;
    }
    prompts = await listMoneyPrompts(workspaceId);
  }

  const gaps = await listCitationGaps(workspaceId, "open");

  return NextResponse.json({
    data: {
      prompts,
      gaps,
      generatedCount,
      checkedCount,
      gapsOpened,
      checkErrors: checkErrors.slice(0, 5),
      domain: workspace.domain,
    },
  });
});
