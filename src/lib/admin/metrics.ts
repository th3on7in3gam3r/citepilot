import { dbAll, dbGet } from "@/lib/db";
import { fetchMrrSummary, gatherSignupBreakdown } from "@/lib/ops/ops-metrics";

function startOfDay(d = new Date()): string {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86400000).toISOString();
}

function monthStart(d = new Date()): string {
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

export type AdminOverviewStats = {
  plans: { free: number; pilot: number; fleet: number; total: number };
  mrr: { configured: boolean; currentMrrCents: number; activeSubscriptions: number };
  signups: { today: number; week: number; month: number };
  audits: { today: number; week: number };
  pilot: { active: number; churnThisMonth: number };
  recentSignups: AdminRecentSignup[];
  recentAudits: AdminRecentAudit[];
};

export type AdminRecentSignup = {
  userId: string;
  email: string;
  plan: string;
  signupAt: string;
};

export type AdminRecentAudit = {
  id: string;
  domain: string;
  score: number;
  createdAt: string;
};

export async function gatherAdminOverview(): Promise<AdminOverviewStats> {
  const now = new Date().toISOString();
  const todayStart = startOfDay();
  const weekStart = daysAgo(7);
  const monthStartIso = monthStart();

  const planRows = await dbAll<{ plan: string; count: number }>(
    `SELECT
       CASE
         WHEN plan = 'fleet' AND status IN ('active', 'trialing', 'past_due') THEN 'fleet'
         WHEN plan = 'pilot' AND status IN ('active', 'trialing', 'past_due') THEN 'pilot'
         ELSE 'free'
       END AS plan,
       COUNT(*) AS count
     FROM billing_accounts
     GROUP BY plan`,
  );

  const plans = { free: 0, pilot: 0, fleet: 0, total: 0 };
  for (const row of planRows) {
    const n = Number(row.count);
    plans.total += n;
    if (row.plan === "pilot") plans.pilot = n;
    else if (row.plan === "fleet") plans.fleet = n;
    else plans.free += n;
  }

  const usersWithoutBilling = await dbGet<{ count: number }>(
    `SELECT COUNT(DISTINCT w.user_id) AS count
     FROM workspaces w
     LEFT JOIN billing_accounts b ON b.user_id = w.user_id
     WHERE w.user_id IS NOT NULL AND w.user_id != '' AND b.user_id IS NULL`,
  );
  plans.free += Number(usersWithoutBilling?.count ?? 0);
  plans.total += Number(usersWithoutBilling?.count ?? 0);

  const signupsToday = await gatherSignupBreakdown(todayStart, now);
  const signupsWeek = await gatherSignupBreakdown(weekStart, now);
  const signupsMonth = await gatherSignupBreakdown(monthStartIso, now);

  const auditsToday = Number(
    (
      await dbGet<{ c: number }>(
        `SELECT COUNT(*) AS c FROM audit_runs WHERE created_at >= ?`,
        [todayStart],
      )
    )?.c ?? 0,
  );
  const auditsWeek = Number(
    (
      await dbGet<{ c: number }>(
        `SELECT COUNT(*) AS c FROM audit_runs WHERE created_at >= ?`,
        [weekStart],
      )
    )?.c ?? 0,
  );

  const pilotActive = Number(
    (
      await dbGet<{ c: number }>(
        `SELECT COUNT(*) AS c FROM billing_accounts
         WHERE plan = 'pilot' AND status IN ('active', 'trialing', 'past_due')`,
      )
    )?.c ?? 0,
  );

  const churnThisMonth = Number(
    (
      await dbGet<{ c: number }>(
        `SELECT COUNT(*) AS c FROM billing_accounts
         WHERE plan IN ('pilot', 'fleet') AND status = 'canceled'
           AND updated_at >= ?`,
        [monthStartIso],
      )
    )?.c ?? 0,
  );

  const mrr = await fetchMrrSummary(monthStartIso, now);

  const recentSignups = await dbAll<{
    user_id: string;
    email: string | null;
    plan: string | null;
    signup_at: string;
  }>(
    `SELECT w.user_id, ur.email, b.plan, MIN(w.created_at) AS signup_at
     FROM workspaces w
     LEFT JOIN user_referrals ur ON ur.user_id = w.user_id
     LEFT JOIN billing_accounts b ON b.user_id = w.user_id
     WHERE w.user_id IS NOT NULL AND w.user_id != ''
     GROUP BY w.user_id, ur.email, b.plan
     ORDER BY signup_at DESC
     LIMIT 10`,
  );

  const recentAudits = await dbAll<{
    id: string;
    domain: string;
    score: number;
    created_at: string;
  }>(
    `SELECT id, domain, score, created_at FROM audit_runs
     ORDER BY created_at DESC LIMIT 10`,
  );

  return {
    plans,
    mrr: {
      configured: mrr.configured,
      currentMrrCents: mrr.currentMrrCents,
      activeSubscriptions: mrr.activeSubscriptions,
    },
    signups: {
      today: signupsToday.total,
      week: signupsWeek.total,
      month: signupsMonth.total,
    },
    audits: { today: auditsToday, week: auditsWeek },
    pilot: { active: pilotActive, churnThisMonth },
    recentSignups: recentSignups.map((row) => ({
      userId: row.user_id,
      email: row.email ?? "—",
      plan: row.plan ?? "free",
      signupAt: row.signup_at,
    })),
    recentAudits: recentAudits.map((row) => ({
      id: row.id,
      domain: row.domain,
      score: row.score,
      createdAt: row.created_at,
    })),
  };
}

export type AdminUserRow = {
  userId: string;
  email: string;
  plan: string;
  status: string;
  signupAt: string;
  lastActive: string;
  auditCount: number;
  workspaceCount: number;
  mrrCents: number;
};

export async function searchAdminUsers(query = "", limit = 50): Promise<AdminUserRow[]> {
  const like = `%${query.trim().toLowerCase()}%`;
  const params: unknown[] = [];
  let where = `WHERE w.user_id IS NOT NULL AND w.user_id != ''`;
  if (query.trim()) {
    where += ` AND (LOWER(COALESCE(ur.email, '')) LIKE ? OR LOWER(w.domain) LIKE ? OR w.user_id LIKE ?)`;
    params.push(like, like, like);
  }

  const rows = await dbAll<{
    user_id: string;
    email: string | null;
    plan: string | null;
    status: string | null;
    signup_at: string;
    last_active: string;
    audit_count: number;
    workspace_count: number;
  }>(
    `SELECT
       w.user_id,
       ur.email,
       b.plan,
       b.status,
       MIN(w.created_at) AS signup_at,
       MAX(w.updated_at) AS last_active,
       COUNT(DISTINCT ar.id) AS audit_count,
       COUNT(DISTINCT w.id) AS workspace_count
     FROM workspaces w
     LEFT JOIN user_referrals ur ON ur.user_id = w.user_id
     LEFT JOIN billing_accounts b ON b.user_id = w.user_id
     LEFT JOIN audit_runs ar ON ar.workspace_id = w.id
     ${where}
     GROUP BY w.user_id, ur.email, b.plan, b.status
     ORDER BY last_active DESC
     LIMIT ?`,
    [...params, limit],
  );

  return rows.map((row) => {
    const plan = row.plan ?? "free";
    const status = row.status ?? "inactive";
    const active = status === "active" || status === "trialing" || status === "past_due";
    let mrrCents = 0;
    if (active && plan === "pilot") mrrCents = 7900;
    if (active && plan === "fleet") mrrCents = 24900;

    return {
      userId: row.user_id,
      email: row.email ?? "—",
      plan,
      status,
      signupAt: row.signup_at,
      lastActive: row.last_active,
      auditCount: Number(row.audit_count),
      workspaceCount: Number(row.workspace_count),
      mrrCents,
    };
  });
}
