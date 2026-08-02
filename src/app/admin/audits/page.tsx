"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";

type AuditRow = {
  id: string;
  domain: string;
  score: number;
  cited: number;
  total: number;
  mode: string;
  status: string;
  createdAt: string;
};

export default function AdminAuditsPage() {
  const [audits, setAudits] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/audits?limit=100", { credentials: "include" });
    if (res.ok) {
      const data = (await res.json()) as { audits: AuditRow[] };
      setAudits(data.audits ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AdminShell activePath="/admin/audits">
      <h2 className="font-display text-lg font-bold text-ink">Audit debugger</h2>
      <p className="mt-1 text-sm text-muted">
        Recent citation audits — click a row for prompts, platform checks, and re-run.
      </p>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-white shadow-sm">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="px-4 py-3 font-medium">Domain</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Score</th>
              <th className="px-4 py-3 font-medium">Mode</th>
              <th className="px-4 py-3 font-medium">Cited</th>
              <th className="px-4 py-3 font-medium">When</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-muted">
                  Loading…
                </td>
              </tr>
            ) : (
              audits.map((audit) => (
                <tr key={audit.id} className="border-b border-border hover:bg-surface/60">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/audits/${audit.id}`}
                      className="font-medium text-accent hover:underline"
                    >
                      {audit.domain}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{audit.status}</td>
                  <td className="px-4 py-3">{audit.score}/100</td>
                  <td className="px-4 py-3 text-muted">{audit.mode}</td>
                  <td className="px-4 py-3 text-muted">
                    {audit.cited}/{audit.total}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(audit.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
