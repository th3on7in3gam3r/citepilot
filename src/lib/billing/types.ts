export type BillingPlan = "free" | "pilot" | "fleet";

export type BillingInterval = "monthly" | "annual";

export type BillingStatus =
  | "inactive"
  | "active"
  | "trialing"
  | "past_due"
  | "canceled";

export type BillingAccount = {
  userId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  plan: BillingPlan;
  status: BillingStatus;
  currentPeriodEnd: string | null;
  updatedAt: string;
};

const activeStatuses: BillingStatus[] = ["active", "trialing"];

export function isActiveBillingStatus(status: BillingStatus): boolean {
  return activeStatuses.includes(status);
}

export function isPilotPlan(account: BillingAccount | null): boolean {
  if (!account) return false;
  return account.plan === "pilot" && isActiveBillingStatus(account.status);
}

export function isFleetPlan(account: BillingAccount | null): boolean {
  if (!account) return false;
  return account.plan === "fleet" && isActiveBillingStatus(account.status);
}

/** Pilot or Fleet with an active subscription (includes manual admin grants). */
export function isPaidPlan(account: BillingAccount | null): boolean {
  return isPilotPlan(account) || isFleetPlan(account);
}

export function planDisplayName(plan: BillingPlan, active: boolean): string {
  if (!active) return "Free (Audit)";
  if (plan === "fleet") return "Fleet";
  if (plan === "pilot") return "Pilot";
  return "Free (Audit)";
}
