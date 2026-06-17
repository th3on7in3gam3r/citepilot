import { getBillingByUserId } from "@/lib/billing/store";
import { isFleetPlan, isPilotPlan } from "@/lib/billing/types";
import { planForUser } from "@/lib/billing/limits-server";

export const MEMBER_LIMIT_PILOT = 3;

export type MemberLimits = {
  plan: "free" | "pilot" | "fleet";
  max: number | null;
  count: number;
  canInvite: boolean;
};

export function memberLimitMessage(limits: MemberLimits): string {
  if (limits.plan === "fleet") {
    return "Fleet includes unlimited team members per workspace.";
  }
  if (limits.plan === "pilot") {
    return `${limits.count} of ${MEMBER_LIMIT_PILOT} members (Pilot)`;
  }
  return "Upgrade to Pilot or Fleet to invite team members.";
}

export async function getMemberLimitsForWorkspace(
  ownerUserId: string,
  memberCount: number,
): Promise<MemberLimits> {
  const billing = await getBillingByUserId(ownerUserId);
  const plan = planForUser(billing);

  if (isFleetPlan(billing)) {
    return { plan: "fleet", max: null, count: memberCount, canInvite: true };
  }

  if (isPilotPlan(billing)) {
    return {
      plan: "pilot",
      max: MEMBER_LIMIT_PILOT,
      count: memberCount,
      canInvite: memberCount < MEMBER_LIMIT_PILOT,
    };
  }

  return {
    plan: "free",
    max: 0,
    count: memberCount,
    canInvite: false,
  };
}
