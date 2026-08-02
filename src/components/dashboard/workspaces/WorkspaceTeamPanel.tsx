"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Panel } from "@/components/dashboard/DashboardUI";
import { useToast } from "@/components/notifications/ToastProvider";
import { useBilling } from "@/contexts/BillingContext";

type MemberRole = "viewer" | "editor";
type MemberStatus = "pending" | "accepted" | "revoked";

type Member = {
  id: string;
  email: string;
  role: MemberRole;
  status: MemberStatus;
  invitedAt: string;
  acceptedAt: string | null;
  name: string | null;
};

type MemberLimits = {
  plan: "free" | "pilot" | "fleet";
  max: number | null;
  count: number;
  canInvite: boolean;
  message: string;
};

const inputClass =
  "mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 dark:border-[#333] dark:bg-[#141414]";

export function WorkspaceTeamPanel({
  workspaceId,
  domain,
  ownerEmail,
}: {
  workspaceId: string;
  domain: string;
  ownerEmail?: string | null;
}) {
  const toast = useToast();
  const { isPilot, isFleet } = useBilling();
  const [members, setMembers] = useState<Member[]>([]);
  const [limits, setLimits] = useState<MemberLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<MemberRole>("viewer");
  const [inviting, setInviting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`, {
        credentials: "include",
      });
      if (!res.ok) {
        setMembers([]);
        setLimits(null);
        return;
      }
      const json = (await res.json()) as {
        data?: { members: Member[]; limits: MemberLimits };
      };
      setMembers(json.data?.members ?? []);
      setLimits(json.data?.limits ?? null);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members/invite`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Failed to send invite");
        return;
      }
      toast.success("Invite sent");
      setInviteEmail("");
      setShowInvite(false);
      await loadMembers();
    } finally {
      setInviting(false);
    }
  }

  async function changeRole(memberId: string, role: MemberRole) {
    setBusyId(memberId);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members/${memberId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        toast.error("Failed to update role");
        return;
      }
      toast.success("Role updated");
      await loadMembers();
    } finally {
      setBusyId(null);
    }
  }

  async function resendInvite(memberId: string) {
    setBusyId(memberId);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members/${memberId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resend: true }),
      });
      if (!res.ok) {
        toast.error("Failed to resend invite");
        return;
      }
      toast.success("Invite resent");
    } finally {
      setBusyId(null);
    }
  }

  async function removeMember(memberId: string) {
    if (!confirm("Remove this member's access immediately?")) return;
    setBusyId(memberId);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members/${memberId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        toast.error("Failed to remove member");
        return;
      }
      toast.success("Access removed");
      await loadMembers();
    } finally {
      setBusyId(null);
    }
  }

  const canManage = limits != null;

  if (!loading && !canManage) {
    return (
      <Panel title="Team" className="mt-0">
        <p className="text-sm text-muted">
          Only the workspace owner can invite and manage team members. Ask the owner
          to add you, or switch to a workspace you own.
        </p>
      </Panel>
    );
  }

  return (
    <Panel title="Team" className="mt-0">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted">
            Collaborators on <strong className="text-ink">{domain}</strong>
          </p>
          {limits && (
            <p className="mt-1 text-xs text-muted">
              {limits.message}
              {limits.plan === "pilot" && !limits.canInvite && (
                <>
                  {" "}
                  <Link href="/pricing" className="font-semibold text-accent hover:underline">
                    Upgrade to Fleet
                  </Link>{" "}
                  for unlimited members.
                </>
              )}
            </p>
          )}
        </div>
        {canManage && (
          <button
            type="button"
            disabled={!limits?.canInvite}
            onClick={() => setShowInvite(true)}
            className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Invite member
          </button>
        )}
      </div>

      {!isPilot && !isFleet && (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Team invites require a Pilot or Fleet plan.{" "}
          <Link href="/pricing" className="font-semibold underline">
            View pricing
          </Link>
        </p>
      )}

      {showInvite && (
        <form
          onSubmit={sendInvite}
          className="mt-6 rounded-2xl border border-border bg-surface/50 p-5"
        >
          <h3 className="text-sm font-semibold text-ink">Invite member</h3>
          <label className="mt-4 block text-sm font-medium text-ink">
            Email
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="collaborator@agency.com"
              className={inputClass}
            />
          </label>
          <fieldset className="mt-4">
            <legend className="text-sm font-medium text-ink">Role</legend>
            <div className="mt-2 space-y-2">
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3">
                <input
                  type="radio"
                  name="role"
                  checked={inviteRole === "viewer"}
                  onChange={() => setInviteRole("viewer")}
                  className="mt-1"
                />
                <span>
                  <span className="block text-sm font-semibold text-ink">Viewer</span>
                  <span className="text-xs text-muted">
                    Can view audits and reports (read-only)
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3">
                <input
                  type="radio"
                  name="role"
                  checked={inviteRole === "editor"}
                  onChange={() => setInviteRole("editor")}
                  className="mt-1"
                />
                <span>
                  <span className="block text-sm font-semibold text-ink">Editor</span>
                  <span className="text-xs text-muted">
                    Can add prompts, run scans, and publish content
                  </span>
                </span>
              </label>
            </div>
          </fieldset>
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={inviting}
              className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {inviting ? "Sending…" : "Send invite"}
            </button>
            <button
              type="button"
              onClick={() => setShowInvite(false)}
              className="rounded-xl border border-border px-4 py-2 text-sm font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 overflow-x-auto">
        {loading ? (
          <div className="h-24 animate-pulse rounded-xl bg-surface" />
        ) : (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <th className="pb-3 pr-4 font-semibold">Name</th>
                <th className="pb-3 pr-4 font-semibold">Email</th>
                <th className="pb-3 pr-4 font-semibold">Role</th>
                <th className="pb-3 pr-4 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/60">
                <td className="py-3 pr-4 font-medium text-ink">You</td>
                <td className="py-3 pr-4 text-muted">{ownerEmail ?? "—"}</td>
                <td className="py-3 pr-4 capitalize text-ink">owner</td>
                <td className="py-3 pr-4">
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                    Active
                  </span>
                </td>
                <td className="py-3 text-muted">—</td>
              </tr>
              {members.map((m) => (
                <tr key={m.id} className="border-b border-border/60">
                  <td className="py-3 pr-4 text-ink">{m.name ?? "—"}</td>
                  <td className="py-3 pr-4 text-muted">{m.email}</td>
                  <td className="py-3 pr-4">
                    {m.status === "accepted" ? (
                      <select
                        value={m.role}
                        disabled={busyId === m.id}
                        onChange={(e) =>
                          void changeRole(m.id, e.target.value as MemberRole)
                        }
                        className="rounded-lg border border-border bg-background px-2 py-1 text-sm"
                        aria-label={`Role for ${m.email}`}
                      >
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                      </select>
                    ) : (
                      <span className="capitalize text-ink">{m.role}</span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    {m.status === "pending" ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
                        Pending
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2">
                      {m.status === "pending" && (
                        <button
                          type="button"
                          disabled={busyId === m.id}
                          onClick={() => void resendInvite(m.id)}
                          className="text-xs font-semibold text-accent hover:underline disabled:opacity-50"
                        >
                          Resend
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busyId === m.id}
                        onClick={() => void removeMember(m.id)}
                        className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
                      >
                        {m.status === "pending" ? "Cancel" : "Remove"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Panel>
  );
}
