export type BillingPlan = "free" | "pilot" | "fleet";

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

export function isPaidPlan(account: BillingAccount | null): boolean {
  if (!account) return false;
  return (
    account.plan === "pilot" &&
    (account.status === "active" || account.status === "trialing")
  );
}
