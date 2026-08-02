import type { WorkspacePreferences } from "@/lib/settings";

/** Build default seed queries from workspace fields for money-prompt generation. */
export function buildDefaultSeedQueries(workspace: {
  domain: string;
  businessType?: string;
  description?: string;
  buyerQuestion?: string;
  preferences?: WorkspacePreferences;
}): string[] {
  const prefs = workspace.preferences;
  const seeds = [
    ...(prefs?.monitoredPrompts ?? []),
    workspace.buyerQuestion ?? "",
    workspace.businessType
      ? `best ${workspace.businessType} tools`
      : "",
    workspace.description
      ? workspace.description.slice(0, 200)
      : "",
    workspace.domain
      ? `alternatives and reviews for sites like ${workspace.domain}`
      : "",
  ]
    .map((s) => s.trim())
    .filter(Boolean);

  // Dedupe case-insensitively, keep order
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const s of seeds) {
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(s);
    if (unique.length >= 10) break;
  }
  return unique;
}
