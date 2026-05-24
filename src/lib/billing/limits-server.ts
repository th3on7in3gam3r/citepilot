import { getBillingByUserId } from "@/lib/billing/store";
import { isFleetPlan, isPilotPlan } from "@/lib/billing/types";
import {
  WORKSPACE_LIMIT_FREE,
  WORKSPACE_LIMIT_PILOT,
  type WorkspaceLimits,
} from "@/lib/billing/limits";
import { countWorkspacesForUser } from "@/lib/server/workspace";

export type { WorkspaceLimits };

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

  const [count, billing] = await Promise.all([
    countWorkspacesForUser(userId),
    getBillingByUserId(userId),
  ]);

  if (isFleetPlan(billing)) {
    return {
      plan: "fleet",
      max: null,
      count,
      canCreate: true,
    };
  }

  if (isPilotPlan(billing)) {
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
