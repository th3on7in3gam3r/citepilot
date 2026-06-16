import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell, formatUsd } from "@/components/admin/AdminShell";
import { getAdminSession } from "@/lib/admin/auth";
import { gatherAdminOverview } from "@/lib/admin/metrics";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const admin = await getAdminSession();
  if (!admin) notFound();

  const stats = await gatherAdminOverview();

  const cards = [
    { label: "Free users", value: String(stats.plans.free) },
    { label: "Pilot users", value: String(stats.plans.pilot) },
    { label: "Fleet users", value: String(stats.plans.fleet) },
    {
      label: "MRR",
      value: stats.mrr.configured ? formatUsd(stats.mrr.currentMrrCents) : "—",
    },
    { label: "Signups today", value: String(stats.signups.today) },
    { label: "Signups this week", value: String(stats.signups.week) },
    { label: "Signups this month", value: String(stats.signups.month) },
    { label: "Audits today", value: String(stats.audits.today) },
    { label: "Audits this week", value: String(stats.audits.week) },
    { label: "Active Pilot subs", value: String(stats.pilot.active) },
    { label: "Churn this month", value: String(stats.pilot.churnThisMonth) },
  ];

  return (
    <AdminShell activePath="/admin" adminEmail={admin.email}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-border bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              {card.label}
            </p>
            <p className="font-display mt-2 text-2xl font-bold text-ink">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <h2 className="font-display text-lg font-bold text-ink">Recent signups</h2>
          <table className="mt-4 w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="pb-2 font-medium">Email</th>
                <th className="pb-2 font-medium">Plan</th>
                <th className="pb-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentSignups.map((row) => (
                <tr key={row.userId} className="border-b border-border last:border-0">
                  <td className="py-2">
                    <Link
                      href={`/admin/users?userId=${encodeURIComponent(row.userId)}`}
                      className="font-medium text-accent hover:underline"
                    >
                      {row.email}
                    </Link>
                  </td>
                  <td className="py-2 text-muted">{row.plan}</td>
                  <td className="py-2 text-muted">
                    {new Date(row.signupAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <h2 className="font-display text-lg font-bold text-ink">Recent audits</h2>
          <table className="mt-4 w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="pb-2 font-medium">Domain</th>
                <th className="pb-2 font-medium">Score</th>
                <th className="pb-2 font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentAudits.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0">
                  <td className="py-2">
                    <Link
                      href={`/admin/audits/${row.id}`}
                      className="font-medium text-accent hover:underline"
                    >
                      {row.domain}
                    </Link>
                  </td>
                  <td className="py-2">{row.score}/100</td>
                  <td className="py-2 text-muted">
                    {new Date(row.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </AdminShell>
  );
}
