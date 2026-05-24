import Link from "next/link";
import type { Metadata } from "next";
import { AdminDeleteButton } from "@/components/admin/AdminDeleteButton";
import {
  getAdminStats,
  listRecentAudits,
  listRecentWorkspaces,
  listWaitlist,
} from "@/lib/server/workspace";

export const metadata: Metadata = {
  title: "Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const stats = await getAdminStats();
  const workspaces = await listRecentWorkspaces(15);
  const audits = await listRecentAudits(15);
  const waitlist = await listWaitlist(20);
  const adminProtected = Boolean(process.env.ADMIN_SECRET);

  const statCards = [
    { label: "Workspaces", value: String(stats.workspaces) },
    { label: "Audits this week", value: String(stats.auditsThisWeek) },
    { label: "Prompts scanned (7d)", value: String(stats.activePrompts) },
    { label: "Waitlist", value: String(stats.waitlistCount) },
  ];

  return (
    <div className="min-h-[100dvh] bg-cream">
      <header className="border-b border-border bg-white px-6 py-5 md:px-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">
              CitePilot · Internal ops
            </p>
            <h1 className="font-display text-2xl font-bold text-ink">
              Admin console
            </h1>
            <p className="mt-1 text-sm text-muted">
              Workspaces, audits, and waitlist — separate from the user dashboard.
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/dashboard" className="font-medium text-muted hover:text-ink">
              User dashboard →
            </Link>
            {adminProtected && (
              <Link href="/api/admin/logout" className="text-muted hover:text-ink">
                Sign out
              </Link>
            )}
          </div>
        </div>
        {!adminProtected && (
          <p className="mx-auto mt-4 max-w-6xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Dev mode: set <code className="text-xs">ADMIN_SECRET</code> in{" "}
            <code className="text-xs">.env.local</code> to require sign-in at{" "}
            <code className="text-xs">/admin/login</code>.
          </p>
        )}
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-6 py-10 md:px-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-border bg-white p-5 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                {s.label}
              </p>
              <p className="font-display mt-2 text-3xl font-bold text-ink">
                {s.value}
              </p>
            </div>
          ))}
        </div>

        <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <h2 className="font-display text-lg font-bold text-ink">
            Recent workspaces
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th className="pb-3 font-medium">Domain</th>
                  <th className="pb-3 font-medium">Category</th>
                  <th className="pb-3 font-medium">Buyer question</th>
                  <th className="pb-3 font-medium">Score</th>
                  <th className="pb-3 font-medium">Updated</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {workspaces.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-muted">
                      No workspaces yet.
                    </td>
                  </tr>
                ) : (
                  workspaces.map((w) => (
                    <tr key={w.id} className="border-b border-border last:border-0">
                      <td className="py-3 font-medium text-ink">{w.domain}</td>
                      <td className="py-3 text-muted">{w.businessType || "—"}</td>
                      <td className="max-w-[200px] truncate py-3 text-muted">
                        {w.buyerQuestion || "—"}
                      </td>
                      <td className="py-3">{w.latestAudit?.score ?? "—"}</td>
                      <td className="py-3 text-muted">
                        {new Date(w.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-right">
                        <AdminDeleteButton kind="workspace" id={w.id} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <h2 className="font-display text-lg font-bold text-ink">
            Recent audits
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th className="pb-3 font-medium">Domain</th>
                  <th className="pb-3 font-medium">Score</th>
                  <th className="pb-3 font-medium">Cited</th>
                  <th className="pb-3 font-medium">Mode</th>
                  <th className="pb-3 font-medium">When</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {audits.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-muted">
                      No audits yet.
                    </td>
                  </tr>
                ) : (
                  audits.map((a) => (
                    <tr key={a.id} className="border-b border-border last:border-0">
                      <td className="py-3 font-medium text-ink">{a.domain}</td>
                      <td className="py-3">{a.score}/100</td>
                      <td className="py-3 text-muted">
                        {a.cited}/{a.total}
                      </td>
                      <td className="py-3 text-muted">{a.mode}</td>
                      <td className="py-3 text-muted">
                        {new Date(a.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 text-right">
                        <AdminDeleteButton kind="audit" id={a.id} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <h2 className="font-display text-lg font-bold text-ink">Waitlist</h2>
          <ul className="mt-4 divide-y divide-border">
            {waitlist.length === 0 ? (
              <li className="py-4 text-sm text-muted">No signups yet.</li>
            ) : (
              waitlist.map((w) => (
                <li
                  key={w.id}
                  className="flex items-center justify-between gap-4 py-3 text-sm"
                >
                  <span className="font-medium text-ink">{w.email}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-muted">
                      {new Date(w.createdAt).toLocaleString()}
                    </span>
                    <AdminDeleteButton kind="waitlist" id={w.id} />
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>
      </main>
    </div>
  );
}
