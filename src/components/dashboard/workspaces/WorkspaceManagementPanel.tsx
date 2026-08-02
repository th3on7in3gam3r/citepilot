"use client";

import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { useEffect, useState } from "react";
import { Panel } from "@/components/dashboard/DashboardUI";
import { deleteWorkspace } from "@/lib/client/api";
import { useToast } from "@/components/notifications/ToastProvider";
import { useBilling } from "@/contexts/BillingContext";

const inputClass =
  "mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 dark:border-[#333] dark:bg-[#141414]";

type WorkspaceManagementPanelProps = {
  workspaceId: string;
  domain: string;
  onChanged: () => void;
  onDeleted: () => void;
};

export function WorkspaceManagementPanel({
  workspaceId,
  domain,
  onChanged,
  onDeleted,
}: WorkspaceManagementPanelProps) {
  const toast = useToast();
  const { isFleet } = useBilling();
  const { workspaces } = useWorkspaceContext();

  const [displayName, setDisplayName] = useState("");
  const [transferEmail, setTransferEmail] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    const item = workspaces.find((w) => w.id === workspaceId);
    if (item?.displayName) setDisplayName(item.displayName);
  }, [workspaces, workspaceId]);

  async function saveDisplayName() {
    setSavingName(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: displayName.trim() || null }),
      });
      if (!res.ok) {
        toast.error("Failed to save display name");
        return;
      }
      toast.success("Display name updated");
      onChanged();
    } finally {
      setSavingName(false);
    }
  }

  async function archiveWorkspace() {
    if (!confirm(`Archive ${domain}? It will be hidden for 90 days before permanent deletion.`)) {
      return;
    }
    setArchiving(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: true }),
      });
      if (!res.ok) {
        toast.error("Failed to archive workspace");
        return;
      }
      toast.success("Workspace archived");
      onChanged();
    } finally {
      setArchiving(false);
    }
  }

  async function handleDelete() {
    if (deleteConfirm.trim() !== domain.trim()) {
      toast.error("Type the domain exactly to confirm deletion");
      return;
    }
    setDeleting(true);
    try {
      const ok = await deleteWorkspace(workspaceId);
      if (!ok) {
        toast.error("Failed to delete workspace");
        return;
      }
      toast.success("Workspace deleted");
      onDeleted();
    } finally {
      setDeleting(false);
    }
  }

  async function transferWorkspace(e: React.FormEvent) {
    e.preventDefault();
    if (!transferEmail.trim()) return;
    if (
      !confirm(
        `Transfer ${domain} to ${transferEmail}? You will lose access to this workspace.`,
      )
    ) {
      return;
    }
    setTransferring(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/transfer`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toEmail: transferEmail.trim() }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Transfer failed");
        return;
      }
      toast.success("Workspace transferred");
      onDeleted();
    } finally {
      setTransferring(false);
    }
  }

  return (
    <Panel title="Workspace management" className="mt-8">
      <div className="space-y-8">
        <div>
          <label className="text-sm font-semibold text-ink">Display name</label>
          <p className="text-xs text-muted">Shown in the switcher — domain stays {domain}</p>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={domain}
            className={inputClass}
          />
          <button
            type="button"
            disabled={savingName}
            onClick={() => void saveDisplayName()}
            className="mt-3 rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {savingName ? "Saving…" : "Save display name"}
          </button>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-ink">Team access</h3>
          <p className="mt-1 text-xs text-muted">
            Invite collaborators to view or edit this workspace.
          </p>
          <a
            href="/dashboard/settings/team"
            className="mt-3 inline-block rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-surface"
          >
            Manage team →
          </a>
        </div>

        {isFleet && (
          <div>
            <h3 className="text-sm font-semibold text-ink">Transfer workspace</h3>
            <p className="mt-1 text-xs text-muted">Fleet admins can move a client site to another account.</p>
            <form onSubmit={transferWorkspace} className="mt-3 flex flex-wrap gap-2">
              <input
                type="email"
                value={transferEmail}
                onChange={(e) => setTransferEmail(e.target.value)}
                placeholder="new-owner@company.com"
                className={`${inputClass} mt-0 min-w-[200px] flex-1`}
              />
              <button
                type="submit"
                disabled={transferring}
                className="self-end rounded-xl border border-border px-4 py-3 text-sm font-semibold disabled:opacity-50"
              >
                {transferring ? "Transferring…" : "Transfer"}
              </button>
            </form>
          </div>
        )}

        <div className="border-t border-border pt-6">
          <h3 className="text-sm font-semibold text-ink">Danger zone</h3>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={archiving}
              onClick={() => void archiveWorkspace()}
              className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 disabled:opacity-50"
            >
              {archiving ? "Archiving…" : "Archive workspace"}
            </button>
            <button
              type="button"
              onClick={() => setShowDelete((v) => !v)}
              className="rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-800"
            >
              Delete workspace
            </button>
          </div>
          {showDelete && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50/50 p-4">
              <p className="text-sm text-red-900">
                Type <strong>{domain}</strong> to permanently delete all data.
              </p>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder={domain}
                className={`${inputClass} mt-2`}
              />
              <button
                type="button"
                disabled={deleting}
                onClick={() => void handleDelete()}
                className="mt-3 rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Permanently delete"}
              </button>
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}
