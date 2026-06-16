"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import type { AuditPayload } from "@/lib/api-types";

type PlatformCheck = {
  platform: string;
  prompt: string;
  cited: boolean;
  checkMode: string;
};

export default function AdminAuditDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [audit, setAudit] = useState<AuditPayload | null>(null);
  const [checks, setChecks] = useState<PlatformCheck[]>([]);
  const [errors, setErrors] = useState<Array<{ prompt: string; reason?: string }>>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/audits/${encodeURIComponent(id)}`, {
      credentials: "include",
    });
    if (!res.ok) return;
    const data = (await res.json()) as {
      audit: AuditPayload;
      platformChecks: PlatformCheck[];
      errors: Array<{ prompt: string; reason?: string }>;
    };
    setAudit(data.audit);
    setChecks(data.platformChecks ?? []);
    setErrors(data.errors ?? []);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function rerun() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/audits/${encodeURIComponent(id)}`, {
        method: "POST",
        credentials: "include",
      });
      const data = (await res.json()) as { audit?: { id: string } };
      if (data.audit?.id) {
        window.location.href = `/admin/audits/${data.audit.id}`;
      }
    } finally {
      setBusy(false);
    }
  }

  if (!audit) {
    return (
      <AdminShell activePath="/admin/audits">
        <p className="text-muted">Loading audit…</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell activePath="/admin/audits">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/audits" className="text-sm font-semibold text-accent hover:underline">
            ← All audits
          </Link>
          <h2 className="font-display mt-2 text-xl font-bold text-ink">{audit.domain}</h2>
          <p className="mt-1 text-sm text-muted">
            Score {audit.score}/100 · {audit.mode} · {audit.cited}/{audit.total} cited
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void rerun()}
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Re-running…" : "Re-run this audit"}
        </button>
      </div>

      <section className="mt-8 rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h3 className="font-semibold text-ink">Prompts sent</h3>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
          {audit.promptResults.map((row) => (
            <li key={row.prompt}>{row.prompt}</li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h3 className="font-semibold text-ink">Platform checks</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="pb-2 font-medium">Platform</th>
                <th className="pb-2 font-medium">Prompt</th>
                <th className="pb-2 font-medium">Cited</th>
                <th className="pb-2 font-medium">Mode</th>
              </tr>
            </thead>
            <tbody>
              {checks.map((check, i) => (
                <tr key={`${check.platform}-${i}`} className="border-b border-border">
                  <td className="py-2">{check.platform}</td>
                  <td className="max-w-xs truncate py-2 text-muted">{check.prompt}</td>
                  <td className="py-2">{check.cited ? "Yes" : "No"}</td>
                  <td className="py-2 text-muted">{check.checkMode}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {errors.length > 0 && (
        <section className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-6">
          <h3 className="font-semibold text-rose-900">Issues / non-citations</h3>
          <ul className="mt-3 space-y-2 text-sm text-rose-950">
            {errors.map((err) => (
              <li key={err.prompt}>
                <strong>{err.prompt}</strong>
                {err.reason ? ` — ${err.reason}` : ""}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h3 className="font-semibold text-ink">Raw prompt results</h3>
        <pre className="mt-3 max-h-96 overflow-auto rounded-xl bg-surface p-4 text-xs">
          {JSON.stringify(audit.promptResults, null, 2)}
        </pre>
      </section>
    </AdminShell>
  );
}
