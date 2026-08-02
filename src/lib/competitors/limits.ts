import type { BillingPlan } from "@/lib/billing/types";

export const COMPETITOR_LIMIT_FREE = 1;
export const COMPETITOR_LIMIT_PILOT = 3;
export const COMPETITOR_LIMIT_FLEET = 10;

export type CompetitorLimits = {
  plan: BillingPlan;
  max: number;
  count: number;
  canAdd: boolean;
};

export function competitorLimitForPlan(plan: BillingPlan): number {
  if (plan === "fleet") return COMPETITOR_LIMIT_FLEET;
  if (plan === "pilot") return COMPETITOR_LIMIT_PILOT;
  return COMPETITOR_LIMIT_FREE;
}

export function buildCompetitorLimits(
  plan: BillingPlan,
  count: number,
): CompetitorLimits {
  const max = competitorLimitForPlan(plan);
  return {
    plan,
    max,
    count,
    canAdd: count < max,
  };
}

export function competitorLimitMessage(limits: CompetitorLimits): string {
  if (limits.plan === "fleet") {
    return `Fleet tracks up to ${limits.max} competitors per workspace (${limits.count}/${limits.max}).`;
  }
  if (limits.plan === "pilot") {
    return `Pilot tracks up to ${limits.max} competitors (${limits.count}/${limits.max}).`;
  }
  return `Free tier tracks ${limits.max} competitor — upgrade to Pilot (${COMPETITOR_LIMIT_PILOT}) or Fleet (${COMPETITOR_LIMIT_FLEET}).`;
}
