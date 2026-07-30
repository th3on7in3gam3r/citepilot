import type { BillingPlan } from "@/lib/billing/types";
import {
  PROMPT_LIMIT_FLEET,
  PROMPT_LIMIT_FREE,
  PROMPT_LIMIT_PILOT,
} from "@/lib/billing/limits";

export type PromptLimits = {
  plan: BillingPlan;
  max: number | null;
  count: number;
  canAdd: boolean;
};

export function promptMaxForPlan(plan: BillingPlan): number | null {
  if (plan === "fleet") return PROMPT_LIMIT_FLEET;
  if (plan === "pilot") return PROMPT_LIMIT_PILOT;
  return PROMPT_LIMIT_FREE;
}

export function applyPromptLimit(
  prompts: string[],
  plan: BillingPlan,
): { prompts: string[]; max: number | null; trimmed: boolean } {
  const cleaned = prompts.map((p) => p.trim()).filter(Boolean);
  const max = promptMaxForPlan(plan);
  if (max === null) {
    return { prompts: cleaned, max: null, trimmed: false };
  }
  if (cleaned.length <= max) {
    return { prompts: cleaned, max, trimmed: false };
  }
  return { prompts: cleaned.slice(0, max), max, trimmed: true };
}

export function promptLimitMessage(limits: PromptLimits): string {
  if (limits.max === null) {
    return "Fleet includes unlimited monitored prompts.";
  }
  if (limits.plan === "pilot") {
    return `Pilot includes up to ${limits.max} monitored prompts (${limits.count}/${limits.max} in this audit).`;
  }
  return `Free tier includes up to ${limits.max} prompts per audit (${limits.count}/${limits.max} used).`;
}

export function promptLimitUpgradeError(limits: PromptLimits): string {
  if (limits.plan === "free") {
    return `Free tier is limited to ${PROMPT_LIMIT_FREE} prompts per audit — upgrade to Pilot (${PROMPT_LIMIT_PILOT}) or Fleet (unlimited).`;
  }
  if (limits.plan === "pilot") {
    return `Pilot is limited to ${PROMPT_LIMIT_PILOT} prompts — upgrade to Fleet for unlimited monitoring.`;
  }
  return "Could not apply Fleet prompt limits — refresh and try again.";
}

export function buildPromptLimits(
  plan: BillingPlan,
  promptCount: number,
): PromptLimits {
  const max = promptMaxForPlan(plan);
  return {
    plan,
    max,
    count: promptCount,
    canAdd: max === null || promptCount < max,
  };
}

/**
 * Parse `/api/billing/limits` prompts.max for the client.
 * `null` = unlimited (Fleet). Only default when the field is missing (`undefined`).
 * Do not use `?? PROMPT_LIMIT_FREE` — that incorrectly turns Fleet unlimited into 10.
 */
export function coalescePromptLimitMax(
  max: number | null | undefined,
): number | null {
  return max === undefined ? PROMPT_LIMIT_FREE : max;
}
