import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { resolveMonitoredPrompts } from "@/lib/audit/resolve-prompts";
import { runCitationAudit } from "@/lib/audit/run-audit";
import { planForUser } from "@/lib/billing/limits-server";
import { getBillingByUserId } from "@/lib/billing/store";
import { archiveWorkspaces } from "@/lib/server/workspace-management";
import { getWorkspaceById } from "@/lib/server/workspace";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";
export const maxDuration = 300;

async function scanWorkspace(workspaceId: string, userId: string) {
  const ws = await getWorkspaceById(workspaceId, userId);
  if (!ws) throw new Error("Workspace not found");

  const billing = await getBillingByUserId(userId);
  const plan = planForUser(billing);
  const prompts = resolveMonitoredPrompts({
    monitoredPrompts: ws.preferences.monitoredPrompts,
    buyerQuestion: ws.buyerQuestion,
  });
  if (prompts.length === 0) {
    throw new Error("Add prompts before running a scan");
  }

  return runCitationAudit({
    domain: ws.domain,
    prompts,
    workspaceId,
    competitors: ws.competitors,
    plan,
    trigger: "manual",
  });
}

export const POST = withApiLogging(async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (auth instanceof NextResponse) return auth;
  const userId = apiUserId(auth);
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  let body: {
    action?: "scan" | "archive" | "export";
    workspaceIds?: string[];
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const ids = (body.workspaceIds ?? []).filter((id) => typeof id === "string");
  if (ids.length === 0) {
    return NextResponse.json({ error: "workspaceIds required" }, { status: 400 });
  }

  if (body.action === "archive") {
    const archived = await archiveWorkspaces(userId, ids);
    return NextResponse.json({ ok: true, archived });
  }

  if (body.action === "scan") {
    const results: { workspaceId: string; ok: boolean; error?: string }[] = [];
    for (const workspaceId of ids) {
      try {
        await scanWorkspace(workspaceId, userId);
        results.push({ workspaceId, ok: true });
      } catch (err) {
        results.push({
          workspaceId,
          ok: false,
          error: err instanceof Error ? err.message : "scan_failed",
        });
      }
    }
    return NextResponse.json({ ok: true, results });
  }

  if (body.action === "export") {
    return NextResponse.json({
      ok: true,
      exports: ids.map((workspaceId) => ({
        workspaceId,
        url: `/api/workspaces/${workspaceId}/export`,
      })),
    });
  }

  return NextResponse.json(
    { error: 'action must be "scan", "archive", or "export"' },
    { status: 400 },
  );
});
