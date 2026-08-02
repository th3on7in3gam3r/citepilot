import { dbAll, dbGet } from "@/lib/db";
import { getStripe } from "@/lib/stripe/server";
import { stripeSecretKey } from "@/lib/stripe/config";

export type SignupBreakdown = {
  free: number;
  pilot: number;
  fleet: number;
  total: number;
};

export type MrrSummary = {
  configured: boolean;
  currentMrrCents: number;
  changeCents: number | null;
  activeSubscriptions: number;
  detail?: string;
};

export async function gatherSignupBreakdown(
  since: string,
  until: string,
): Promise<SignupBreakdown> {
  const rows = await dbAll<{ tier: string; count: number }>(
    `SELECT tier, COUNT(*) AS count FROM (
       SELECT DISTINCT w.user_id AS uid,
         CASE
           WHEN b.plan = 'fleet' AND b.status IN ('active', 'trialing', 'past_due') THEN 'fleet'
           WHEN b.plan = 'pilot' AND b.status IN ('active', 'trialing', 'past_due') THEN 'pilot'
           ELSE 'free'
         END AS tier
       FROM workspaces w
       LEFT JOIN billing_accounts b ON b.user_id = w.user_id
       WHERE w.user_id IS NOT NULL AND w.user_id != ''
         AND w.created_at >= ? AND w.created_at < ?
     ) AS signups GROUP BY tier`,
    [since, until],
  );

  const breakdown: SignupBreakdown = {
    free: 0,
    pilot: 0,
    fleet: 0,
    total: 0,
  };

  for (const row of rows) {
    const n = Number(row.count);
    breakdown.total += n;
    if (row.tier === "pilot") breakdown.pilot = n;
    else if (row.tier === "fleet") breakdown.fleet = n;
    else breakdown.free += n;
  }

  return breakdown;
}

function monthlyAmountCents(
  unitAmount: number | null | undefined,
  interval: string | undefined,
  quantity: number,
): number {
  if (!unitAmount) return 0;
  const qty = quantity || 1;
  if (interval === "year") return Math.round((unitAmount / 12) * qty);
  return unitAmount * qty;
}

export async function fetchMrrSummary(
  since: string,
  until: string,
): Promise<MrrSummary> {
  if (!stripeSecretKey()) {
    return {
      configured: false,
      currentMrrCents: 0,
      changeCents: null,
      activeSubscriptions: 0,
      detail: "STRIPE_SECRET_KEY not configured",
    };
  }

  try {
    const stripe = getStripe();
    let currentMrrCents = 0;
    let activeSubscriptions = 0;

    for await (const sub of stripe.subscriptions.list({
      status: "active",
      limit: 100,
      expand: ["data.items.data.price"],
    })) {
      activeSubscriptions += 1;
      for (const item of sub.items.data) {
        currentMrrCents += monthlyAmountCents(
          item.price?.unit_amount,
          item.price?.recurring?.interval,
          item.quantity ?? 1,
        );
      }
    }

    const newPaid = await dbGet<{ pilot: number; fleet: number }>(
      `SELECT
         SUM(CASE WHEN plan = 'pilot' THEN 1 ELSE 0 END) AS pilot,
         SUM(CASE WHEN plan = 'fleet' THEN 1 ELSE 0 END) AS fleet
       FROM billing_accounts
       WHERE status IN ('active', 'trialing')
         AND plan IN ('pilot', 'fleet')
         AND updated_at >= ? AND updated_at < ?`,
      [since, until],
    );

    const churned = await dbGet<{ count: number }>(
      `SELECT COUNT(*) AS count FROM billing_accounts
       WHERE status = 'canceled' AND updated_at >= ? AND updated_at < ?`,
      [since, until],
    );

    const pilotAdds = Number(newPaid?.pilot ?? 0);
    const fleetAdds = Number(newPaid?.fleet ?? 0);
    const churnCount = Number(churned?.count ?? 0);
    const estimatedPilotMrr = 7900;
    const estimatedFleetMrr = 24900;
    const changeCents =
      pilotAdds * estimatedPilotMrr +
      fleetAdds * estimatedFleetMrr -
      churnCount * estimatedPilotMrr;

    return {
      configured: true,
      currentMrrCents,
      changeCents,
      activeSubscriptions,
    };
  } catch (error) {
    return {
      configured: false,
      currentMrrCents: 0,
      changeCents: null,
      activeSubscriptions: 0,
      detail: error instanceof Error ? error.message : "Stripe API failed",
    };
  }
}

export function formatUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
