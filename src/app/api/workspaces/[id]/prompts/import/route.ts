import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { parsePromptCsv } from "@/lib/prompts/csv";
import { applyPromptLimit } from "@/lib/billing/prompt-limits";
import { getBillingByUserId } from "@/lib/billing/store";
import { planForUser } from "@/lib/billing/limits-server";
import { requireFleetAccess } from "@/lib/fleet/request-auth";
import { mergePreferences } from "@/lib/settings";
import { getWorkspaceById, updateWorkspace } from "@/lib/server/workspace";
import { withApiLogging } from "@/lib/observability/api-log";
import {
  PROMPT_IMPORT_MAX_PER_BATCH,
  PROMPT_IMPORT_RATE_LIMIT_PER_HOUR,
} from "@/lib/rate-limit/constants";
import { enforceHourlyRateLimit } from "@/lib/rate-limit/request";
import type { PromptImportInput } from "@/lib/prompts/types";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

function normalizeInputs(raw: PromptImportInput[]): PromptImportInput[] {
  return raw
    .map((row) => ({
      prompt_text: row.prompt_text?.trim() ?? "",
      category: row.category?.trim() || undefined,
    }))
    .filter((row) => row.prompt_text.length > 0);
}

function mergePrompts(existing: string[], incoming: string[]): {
  merged: string[];
  imported: number;
  skipped: number;
} {
  const seen = new Set(existing.map((p) => p.toLowerCase()));
  const merged = [...existing];
  let imported = 0;
  let skipped = 0;

  for (const prompt of incoming) {
    const key = prompt.toLowerCase();
    if (seen.has(key)) {
      skipped += 1;
      continue;
    }
    seen.add(key);
    merged.push(prompt);
    imported += 1;
  }

  return { merged, imported, skipped };
}

export const POST = withApiLogging(async function POST(request: Request, { params }: Params) {
  try {
    const fleetAuth = await requireFleetAccess(request);
    let userId: string | null = null;

    if (!(fleetAuth instanceof NextResponse)) {
      userId = fleetAuth.userId;
    } else {
      if (fleetAuth.status === 429) return fleetAuth;
      const session = await requireApiUser(request);
      if (session instanceof NextResponse) return session;
      userId = apiUserId(session);
      if (!userId) {
        return NextResponse.json({ error: "Sign in required" }, { status: 401 });
      }
    }

    const rate = await enforceHourlyRateLimit(
      `prompt-import:${userId}`,
      PROMPT_IMPORT_RATE_LIMIT_PER_HOUR,
      `Import limit reached (${PROMPT_IMPORT_RATE_LIMIT_PER_HOUR}/hour). Try again later.`,
    );
    if (rate instanceof NextResponse) return rate;

    const { id } = await params;
    const workspace = await getWorkspaceById(id, userId);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const contentType = request.headers.get("content-type") ?? "";
    let inputs: PromptImportInput[] = [];

    if (contentType.includes("application/json")) {
      const body = (await request.json()) as { prompts?: PromptImportInput[] };
      inputs = normalizeInputs(body.prompts ?? []);
    } else if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      let csvText = "";
      if (file instanceof File) {
        csvText = await file.text();
      } else {
        const raw = form.get("csv");
        csvText = typeof raw === "string" ? raw : "";
      }
      inputs = parsePromptCsv(csvText).map((prompt_text) => ({ prompt_text }));
    } else {
      const csvText = await request.text();
      inputs = parsePromptCsv(csvText).map((prompt_text) => ({ prompt_text }));
    }

    if (inputs.length === 0) {
      return NextResponse.json(
        { error: "No prompts found. Use prompt_text column or one prompt per line." },
        { status: 400 },
      );
    }

    if (inputs.length > PROMPT_IMPORT_MAX_PER_BATCH) {
      return NextResponse.json(
        {
          error: `Maximum ${PROMPT_IMPORT_MAX_PER_BATCH} prompts per import.`,
          code: "IMPORT_BATCH_TOO_LARGE",
        },
        { status: 400 },
      );
    }

    const errors: { prompt_text: string; reason: string }[] = [];
    const accepted: string[] = [];
    for (const row of inputs) {
      const text = row.prompt_text.trim();
      if (text.length < 10) {
        errors.push({ prompt_text: text, reason: "too_short" });
        continue;
      }
      if (text.length > 200) {
        errors.push({ prompt_text: text, reason: "too_long" });
        continue;
      }
      accepted.push(text);
    }

    const existing = workspace.preferences.monitoredPrompts ?? [];
    const { merged, imported, skipped } = mergePrompts(existing, accepted);

    const billing = await getBillingByUserId(userId);
    const plan = planForUser(billing);
    const { prompts, trimmed, max } = applyPromptLimit(merged, plan);
    const trimmedCount = merged.length - prompts.length;

    const prefs = mergePreferences(workspace.preferences, {
      monitoredPrompts: prompts,
    });

    const updated = await updateWorkspace(id, { preferences: prefs }, userId);
    if (!updated) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      imported,
      skipped: skipped + trimmedCount,
      trimmed,
      max,
      errors,
      monitoredPrompts: prefs.monitoredPrompts,
    });
  } catch (error) {
    console.error("POST /api/workspaces/[id]/prompts/import", error);
    return NextResponse.json({ error: "Failed to import prompts" }, { status: 500 });
  }
});
