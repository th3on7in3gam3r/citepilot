"use client";

import { useCallback, useEffect, useState } from "react";
import { Panel } from "@/components/dashboard/DashboardUI";
import { useToast } from "@/components/notifications/ToastProvider";
import { useBilling } from "@/contexts/BillingContext";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { getStoredWorkspaceId } from "@/lib/client/api";

export function FleetRequire2faPanel() {
  const toast = useToast();
  const { isFleet } = useBilling();
  const { workspace, refresh } = useWorkspaceContext();
  const workspaceId = workspace?.workspaceId ?? workspace?.id ?? getStoredWorkspaceId();
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setEnabled(Boolean(workspace?.preferences?.require2faForMembers));
  }, [workspace?.preferences?.require2faForMembers]);

  const save = useCallback(
    async (next: boolean) => {
      if (!workspaceId) return;
      setBusy(true);
      try {
        const res = await fetch(`/api/workspaces/${workspaceId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            preferences: { require2faForMembers: next },
          }),
        });
        if (!res.ok) {
          toast.error("Could not update workspace security policy");
          return;
        }
        setEnabled(next);
        void refresh();
        toast.success(
          next
            ? "Members must enable 2FA before accessing this workspace"
            : "2FA requirement removed for workspace members",
        );
      } finally {
        setBusy(false);
      }
    },
    [workspaceId, refresh, toast],
  );

  if (!isFleet || !workspaceId) return null;

  return (
    <Panel title="Fleet security policy">
      <p className="text-sm text-muted">
        Require every workspace member to enable two-factor authentication before
        they can access this workspace. Recommended for enterprise Fleet contracts.
      </p>
      <label className="mt-4 flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={enabled}
          disabled={busy}
          onChange={(e) => void save(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-border text-accent focus:ring-accent/30"
        />
        <span className="text-sm text-ink">
          <strong>Require 2FA for all members</strong>
          <span className="mt-1 block text-muted">
            Members without 2FA are redirected to Security settings until they set
            it up.
          </span>
        </span>
      </label>
    </Panel>
  );
}
