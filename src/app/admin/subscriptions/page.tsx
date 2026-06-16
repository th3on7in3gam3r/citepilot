"use client";

import { useCallback, useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { AdminShell, formatUsd } from "@/components/admin/AdminShell";

type SubscriptionRow = {
  id: string;
  customerEmail: string | null;
  plan: string;
  status: string;
  mrrCents: number;
  currentPeriodEnd: string | null;
};

export default function AdminSubscriptionsPage() {
  const [rows, setRows] = useState<SubscriptionRow[]>([]);
  const [history, setHistory] = useState<Array<{ month: string; mrrCents: number }>>([]);
  const [configured, setConfigured] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/subscriptions", { credentials: "include" });
    if (!res.ok) return;
    const data = (await res.json()) as {
      configured: boolean;
      subscriptions: SubscriptionRow[];
      mrrHistory: Array<{ month: string; mrrCents: number }>;
    };
    setConfigured(data.configured);
    setRows(data.subscriptions ?? []);
    setHistory(data.mrrHistory ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function action(id: string, actionName: string) {
    const res = await fetch(`/api/admin/subscriptions/${encodeURIComponent(id)}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: actionName }),
    });
    setMsg(res.ok ? `${actionName} applied` : `${actionName} failed`);
    void load();
  }

  return (
    <AdminShell activePath="/admin/subscriptions">
      <h2 className="font-display text-lg font-bold text-ink">Subscriptions</h2>
      {!configured && (
        <p className="mt-2 text-sm text-amber-800">Stripe is not configured on this deployment.</p>
      )}
      {msg && <p className="mt-2 text-sm font-medium text-accent">{msg}</p>}

      <div className="mt-6 h-64 rounded-2xl border border-border bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">MRR (12 mo)</p>
        <ResponsiveContainer width="100%" height="90%">
          <LineChart data={history}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${Math.round(v / 100)}`} />
            <Tooltip formatter={(v) => formatUsd(Number(v))} />
            <Line type="monotone" dataKey="mrrCents" stroke="#0ea5e9" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-white shadow-sm">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">MRR</th>
              <th className="px-4 py-3 font-medium">Next bill</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border">
                <td className="px-4 py-3">{row.customerEmail ?? row.id}</td>
                <td className="px-4 py-3 text-muted">{row.plan}</td>
                <td className="px-4 py-3 text-muted">{row.status}</td>
                <td className="px-4 py-3">{formatUsd(row.mrrCents)}</td>
                <td className="px-4 py-3 text-muted">
                  {row.currentPeriodEnd
                    ? new Date(row.currentPeriodEnd).toLocaleDateString()
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <ActionBtn label="Cancel" onClick={() => void action(row.id, "cancel")} />
                    <ActionBtn label="Pause" onClick={() => void action(row.id, "pause")} />
                    <ActionBtn label="Credit" onClick={() => void action(row.id, "credit")} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

function ActionBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-border px-2.5 py-1 text-xs font-semibold"
    >
      {label}
    </button>
  );
}
