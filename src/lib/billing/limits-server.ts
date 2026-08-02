import { getBillingByUserId } from "@/lib/billing/store";
import {
  isFleetPlan,
  isPilotPlan,
  type BillingPlan,
} from "@/lib/billing/types";
import { userHasFleetOverride } from "@/lib/billing/fleet-override";
import {
  WORKSPACE_LIMIT_FREE,
  WORKSPACE_LIMIT_PILOT,
  type WorkspaceLimits,
} from "@/lib/billing/limits";
import {
  buildPromptLimits,
  type PromptLimits,
} from "@/lib/billing/prompt-limits";
import {
  buildCompetitorLimits,
  type CompetitorLimits,
} from "@/lib/competitors/limits";
import { countActiveWorkspacesForUser } from "@/lib/server/workspace-management";

export type { WorkspaceLimits, PromptLimits, CompetitorLimits };

export function planForUser(
  billing: Awaited<ReturnType<typeof getBillingByUserId>>,
): BillingPlan {
  if (isFleetPlan(billing)) return "fleet";
  if (isPilotPlan(billing)) return "pilot";
  return "free";
}

/** Billing plan including temporary Fleet QA override for allowlisted session emails. */
export async function getEffectivePlanForUser(
  userId: string | null,
): Promise<BillingPlan> {
  if (!userId) return "free";
  if (await userHasFleetOverride(userId)) return "fleet";
  const billing = await getBillingByUserId(userId);
  return planForUser(billing);
}

export async function getPromptLimitsForUser(
  userId: string | null,
  promptCount = 0,
): Promise<PromptLimits> {
  if (!userId) {
    return buildPromptLimits("free", promptCount);
  }
  const plan = await getEffectivePlanForUser(userId);
  return buildPromptLimits(plan, promptCount);
}

export async function getCompetitorLimitsForUser(
  userId: string | null,
  competitorCount = 0,
): Promise<CompetitorLimits> {
  if (!userId) {
    return buildCompetitorLimits("free", competitorCount);
  }
  const plan = await getEffectivePlanForUser(userId);
  return buildCompetitorLimits(plan, competitorCount);
}

export async function getWorkspaceLimitsForUser(
  userId: string | null,
): Promise<WorkspaceLimits> {
  if (!userId) {
    return {
      plan: "free",
      max: WORKSPACE_LIMIT_FREE,
      count: 0,
      canCreate: true,
    };
  }

  const [count, plan] = await Promise.all([
    countActiveWorkspacesForUser(userId),
    getEffectivePlanForUser(userId),
  ]);

  if (plan === "fleet") {
    return {
      plan: "fleet",
      max: null,
      count,
      canCreate: true,
    };
  }

  if (plan === "pilot") {
    return {
      plan: "pilot",
      max: WORKSPACE_LIMIT_PILOT,
      count,
      canCreate: count < WORKSPACE_LIMIT_PILOT,
    };
  }

  return {
    plan: "free",
    max: WORKSPACE_LIMIT_FREE,
    count,
    canCreate: count < WORKSPACE_LIMIT_FREE,
  };
}
