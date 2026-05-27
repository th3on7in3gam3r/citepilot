export type WorkspaceLimits = {
  plan: "free" | "pilot" | "fleet";
  max: number | null;
  count: number;
  canCreate: boolean;
};

export const WORKSPACE_LIMIT_FREE = 1;
export const WORKSPACE_LIMIT_PILOT = 3;

/** Max buyer prompts per audit / monitoring run */
export const PROMPT_LIMIT_FREE = 10;
export const PROMPT_LIMIT_PILOT = 25;
/** Fleet — no cap */
export const PROMPT_LIMIT_FLEET = null;

export function workspaceLimitMessage(limits: WorkspaceLimits): string {
  if (limits.plan === "fleet") {
    return "Fleet includes unlimited client workspaces.";
  }
  if (limits.plan === "pilot") {
    return `Pilot includes up to ${WORKSPACE_LIMIT_PILOT} workspaces (${limits.count}/${WORKSPACE_LIMIT_PILOT} used).`;
  }
  return `Free tier includes ${WORKSPACE_LIMIT_FREE} workspace. Upgrade to Pilot or Fleet for more clients.`;
}

export function workspaceLimitUpgradeError(limits: WorkspaceLimits): string {
  if (limits.plan === "free") {
    return "Free tier is limited to 1 workspace — upgrade to Pilot (3) or Fleet (unlimited) on the Pricing page.";
  }
  if (limits.plan === "pilot") {
    return `Pilot is limited to ${WORKSPACE_LIMIT_PILOT} workspaces — upgrade to Fleet for unlimited client sites.`;
  }
  return "Workspace limit reached.";
}
