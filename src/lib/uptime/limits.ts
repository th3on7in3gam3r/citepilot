import { getBillingByUserId } from "@/lib/billing/store";
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
  const billing = await getBillingByUserId(userId);
  const plan = billing?.plan ?? "free";
  const limit = monitorLimitForPlan(plan);
  const count = await countMonitorsForUser(userId);
  return {
    allowed: count < limit,
    limit,
    count,
    plan,
  };
}
