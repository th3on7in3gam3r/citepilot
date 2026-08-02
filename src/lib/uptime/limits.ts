import { getEffectivePlanForUser } from "@/lib/billing/limits-server";
import type { BillingPlan } from "@/lib/billing/types";
import { countMonitorsForUser } from "@/lib/uptime/store";
import { MONITOR_LIMITS } from "@/lib/uptime/types";

export function monitorLimitForPlan(plan: BillingPlan): number {
  return MONITOR_LIMITS[plan] ?? 0;
}

export async function assertMonitorQuota(userId: string): Promise<{
  allowed: boolean;
  limit: number;
  count: number;
  plan: BillingPlan;
}> {
  // Must use effective plan (Stripe + Fleet QA override) — raw billing.plan
  // made override Fleet users look like Free (0 monitors).
  const plan = await getEffectivePlanForUser(userId);
  const limit = monitorLimitForPlan(plan);
  const count = await countMonitorsForUser(userId);
  return {
    allowed: count < limit,
    limit,
    count,
    plan,
  };
}
