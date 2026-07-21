"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DashboardEmptyState } from "@/components/dashboard/layout/DashboardEmptyState";
import type { WorkspaceSnapshot } from "@/lib/dashboard";

export function DashboardWorkspaceEmpty({
  workspace,
}: {
  workspace: WorkspaceSnapshot;
}) {
  const [isFleet, setIsFleet] = useState(false);

  useEffect(() => {
    void fetch("/api/billing/status", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { isFleet?: boolean } | null) => setIsFleet(Boolean(data?.isFleet)))
      .catch(() => undefined);
  }, []);

  return (
    <DashboardEmptyState
      title="Your citation workspace is ready"
      description="Add your first money prompts to start tracking where AI cites you."
      primaryHref="/dashboard/content?section=targeting"
      primaryLabel="Add your first prompt →"
      secondaryHref={isFleet ? "/dashboard/settings#fleet-import" : undefined}
      secondaryLabel={isFleet ? "Import prompts from CSV" : undefined}
      footer={
        <p className="text-xs text-muted">
          Domain:{" "}
          <span className="font-medium text-ink">{workspace.domain}</span>
          {" · "}
          <Link
            href="/dashboard/content?section=targeting"
            data-tour="prompts"
            className="font-medium text-accent hover:text-accent-deep"
          >
            Open targeting
          </Link>
        </p>
      }
    />
  );
}
