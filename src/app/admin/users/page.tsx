"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { formatUsd } from "@/lib/format-usd";
import type { AdminUserRow } from "@/lib/admin/metrics";

type UserDetail = {
  userId: string;
  email: string | null;
  workspaces: Array<{ id: string; domain: string; updated_at: string }>;
  audits: Array<{ id: string; domain: string; score: number; created_at: string }>;
};

function AdminUsersContent() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");

  const load = useCallback(async (q = query) => {
    setLoading(true);
    const res = await fetch(`/api/admin/users?q=${encodeURIComponent(q)}`, {
      credentials: "include",
    });
    if (res.ok) {
      const data = (await res.json()) as { users: AdminUserRow[] };
      setUsers(data.users ?? []);
    }
    setLoading(false);
  }, [query]);

  useEffect(() => {
    void load("");
  }, [load]);

  async function openUser(userId: string) {
    setExpanded(userId);
    setDetail(null);
    const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
      credentials: "include",
    });
    if (res.ok) setDetail((await res.json()) as UserDetail);
  }

  async function changePlan(userId: string, plan: string) {
    const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/plan`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    setActionMsg(res.ok ? "Plan updated" : "Plan update failed");
    void openUser(userId);
    void load();
  }

  async function applyCredit(userId: string) {
    const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/credit`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ months: 1 }),
    });
    setActionMsg(res.ok ? "Credit applied" : "Credit failed");
  }

  async function impersonate(userId: string, email: string) {
    const res = await fetch("/api/admin/impersonate", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, email }),
    });
    if (res.ok) window.location.href = "/dashboard";
    else setActionMsg("Impersonation failed");
  }

  async function sendEmail(userId: string) {
    const subject = window.prompt("Email subject");
    const body = window.prompt("Email body (plain text)");
    if (!subject || !body) return;
    const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/email`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, body }),
    });
    setActionMsg(res.ok ? "Email sent" : "Email failed");
  }

  async function deleteUser(userId: string, email: string) {
    if (
      !window.confirm(
        `Hard delete ${email}? This removes workspaces, audits, and billing data.`,
      )
    ) {
      return;
    }
    const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      setExpanded(null);
      void load();
    } else setActionMsg("Delete failed");
  }

  return (
    <>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex-1 text-sm">
          <span className="font-semibold text-ink">Search users</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void load(query);
            }}
            placeholder="Email, domain, or user ID"
            className="mt-1 w-full rounded-xl border border-border px-3 py-2.5"
          />
        </label>
        <button
          type="button"
          onClick={() => void load(query)}
          className="rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white"
        >
          Search
        </button>
      </div>

      {actionMsg && <p className="mt-4 text-sm font-medium text-accent">{actionMsg}</p>}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-white shadow-sm">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Signup</th>
              <th className="px-4 py-3 font-medium">Last active</th>
              <th className="px-4 py-3 font-medium">Audits</th>
              <th className="px-4 py-3 font-medium">MRR</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-muted">
                  Loading…
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-muted">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <UserRow
                  key={user.userId}
                  user={user}
                  expanded={expanded === user.userId}
                  detail={expanded === user.userId ? detail : null}
                  onOpen={() => void openUser(user.userId)}
                  onPlan={(plan) => void changePlan(user.userId, plan)}
                  onCredit={() => void applyCredit(user.userId)}
                  onImpersonate={() => void impersonate(user.userId, user.email)}
                  onEmail={() => void sendEmail(user.userId)}
                  onDelete={() => void deleteUser(user.userId, user.email)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function UserRow({
  user,
  expanded,
  detail,
  onOpen,
  onPlan,
  onCredit,
  onImpersonate,
  onEmail,
  onDelete,
}: {
  user: AdminUserRow;
  expanded: boolean;
  detail: UserDetail | null;
  onOpen: () => void;
  onPlan: (plan: string) => void;
  onCredit: () => void;
  onImpersonate: () => void;
  onEmail: () => void;
  onDelete: () => void;
}) {
  return (
    <>
      <tr
        className="cursor-pointer border-b border-border hover:bg-surface/60"
        onClick={onOpen}
      >
        <td className="px-4 py-3 font-medium text-ink">{user.email}</td>
        <td className="px-4 py-3 text-muted">
          {user.plan} · {user.status}
        </td>
        <td className="px-4 py-3 text-muted">
          {new Date(user.signupAt).toLocaleDateString()}
        </td>
        <td className="px-4 py-3 text-muted">
          {new Date(user.lastActive).toLocaleDateString()}
        </td>
        <td className="px-4 py-3">{user.auditCount}</td>
        <td className="px-4 py-3">{formatUsd(user.mrrCents)}</td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={6} className="bg-surface/40 px-4 py-4">
            {detail ? (
              <div className="space-y-4">
                <p className="text-xs text-muted">User ID: {detail.userId}</p>
                <div className="flex flex-wrap gap-2">
                  <ActionBtn label="Set Pilot" onClick={() => onPlan("pilot")} />
                  <ActionBtn label="Set Fleet" onClick={() => onPlan("fleet")} />
                  <ActionBtn label="Set Free" onClick={() => onPlan("free")} />
                  <ActionBtn label="Add 1 free month" onClick={onCredit} />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onImpersonate();
                    }}
                    className="rounded-full bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Impersonate
                  </button>
                  <ActionBtn label="Send email" onClick={onEmail} />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                    className="rounded-full border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700"
                  >
                    Delete account
                  </button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="font-semibold text-ink">Workspaces</h3>
                    <ul className="mt-2 space-y-1 text-sm text-muted">
                      {detail.workspaces.map((ws) => (
                        <li key={ws.id}>
                          {ws.domain} · {new Date(ws.updated_at).toLocaleDateString()}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-ink">Recent audits</h3>
                    <ul className="mt-2 space-y-1 text-sm">
                      {detail.audits.map((audit) => (
                        <li key={audit.id}>
                          <Link
                            href={`/admin/audits/${audit.id}`}
                            className="text-accent hover:underline"
                          >
                            {audit.domain}
                          </Link>{" "}
                          · {audit.score}/100
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted">Loading user…</p>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function ActionBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold"
    >
      {label}
    </button>
  );
}

export default function AdminUsersPage() {
  return (
    <AdminShell activePath="/admin/users">
      <AdminUsersContent />
    </AdminShell>
  );
}
