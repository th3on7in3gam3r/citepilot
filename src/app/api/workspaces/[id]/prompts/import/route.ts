import { NextResponse } from "next/server";
import { parsePromptCsv } from "@/lib/audit/prompt-csv";
import { applyPromptLimit } from "@/lib/billing/prompt-limits";
import { getBillingByUserId } from "@/lib/billing/store";
import { planForUser } from "@/lib/billing/limits-server";
import { requireFleetAccess } from "@/lib/fleet/request-auth";
import { mergePreferences } from "@/lib/settings";
import { getWorkspaceById, updateWorkspace } from "@/lib/server/workspace";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export const POST = withApiLogging(async function POST(request: Request, { params }: Params) {
  try {
    const auth = await requireFleetAccess(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const workspace = await getWorkspaceById(id, auth.userId);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const contentType = request.headers.get("content-type") ?? "";
    let csvText = "";

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (file instanceof File) {
        csvText = await file.text();
      } else {
        const raw = form.get("csv");
        csvText = typeof raw === "string" ? raw : "";
      }
    } else {
      csvText = await request.text();
    }

    const imported = parsePromptCsv(csvText);
    if (imported.length === 0) {
      return NextResponse.json(
        { error: "No prompts found in CSV. Use a prompt column or one prompt per line." },
        { status: 400 },
      );
    }

    const billing = await getBillingByUserId(auth.userId);
    const plan = planForUser(billing);
    const { prompts, trimmed, max } = applyPromptLimit(imported, plan);
    const merged = mergePreferences(workspace.preferences, {
      monitoredPrompts: prompts,
    });

    const updated = await updateWorkspace(
      id,
      { preferences: merged },
      auth.userId,
    );
    if (!updated) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      imported: prompts.length,
      trimmed,
      max,
      monitoredPrompts: merged.monitoredPrompts,
    });
  } catch (error) {
    console.error("POST /api/workspaces/[id]/prompts/import", error);
    return NextResponse.json({ error: "Failed to import prompts" }, { status: 500 });
  }
});
