import type { WorkspacePreferences } from "@/lib/settings";

export function resolveMonitoredPrompts(input: {
  monitoredPrompts?: string[];
  buyerQuestion?: string;
  auditPrompts?: string[];
}): string[] {
  const fromPrefs = (input.monitoredPrompts ?? [])
    .map((p) => p.trim())
    .filter(Boolean);
  if (fromPrefs.length > 0) return fromPrefs;

  const fromAudit = (input.auditPrompts ?? [])
    .map((p) => p.trim())
    .filter(Boolean);
  if (fromAudit.length > 0) return fromAudit;

  const buyer = input.buyerQuestion?.trim();
  if (buyer) return [buyer];
  return [];
}

export function promptsFromPreferences(
  preferences: WorkspacePreferences,
  buyerQuestion: string,
): string[] {
  return resolveMonitoredPrompts({
    monitoredPrompts: preferences.monitoredPrompts,
    buyerQuestion,
  });
}
