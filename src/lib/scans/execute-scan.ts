import { resolveMonitoredPrompts } from "@/lib/audit/resolve-prompts";
import { runCitationAudit } from "@/lib/audit/run-audit";
import { getEffectivePlanForUser } from "@/lib/billing/limits-server";
import { getWorkspaceById } from "@/lib/server/workspace";
import type { AuditTrigger } from "@/lib/scans/types";

export async function executeWorkspaceScan(input: {
  workspaceId: string;
  userId: string;
  trigger: AuditTrigger;
}): Promise<{ auditId: string; durationMs: number }> {
  const ws = await getWorkspaceById(input.workspaceId, input.userId);
  if (!ws) throw new Error("Workspace not found");

  const plan = await getEffectivePlanForUser(input.userId);
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
