import { resolveMonitoredPrompts } from "@/lib/audit/resolve-prompts";
import { runCitationAudit } from "@/lib/audit/run-audit";
import { planForUser } from "@/lib/billing/limits-server";
import { getBillingByUserId } from "@/lib/billing/store";
import { getWorkspaceById } from "@/lib/server/workspace";
import type { AuditTrigger } from "@/lib/scans/types";

export async function executeWorkspaceScan(input: {
  workspaceId: string;
  userId: string;
  trigger: AuditTrigger;
}): Promise<{ auditId: string; durationMs: number }> {
  const ws = await getWorkspaceById(input.workspaceId, input.userId);
  if (!ws) throw new Error("Workspace not found");

  const billing = await getBillingByUserId(input.userId);
  const plan = planForUser(billing);
  const prompts = resolveMonitoredPrompts({
    monitoredPrompts: ws.preferences.monitoredPrompts,
    buyerQuestion: ws.buyerQuestion,
  });
  if (prompts.length === 0) {
    throw new Error("Add prompts before running a scan");
  }

  const started = Date.now();
  const audit = await runCitationAudit({
    domain: ws.domain,
    prompts,
    workspaceId: input.workspaceId,
    competitors: ws.competitors,
    plan,
    trigger: input.trigger,
    startedAtMs: started,
  });

  return {
    auditId: audit.id,
    durationMs: Date.now() - started,
  };
}
