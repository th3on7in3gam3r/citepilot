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
      description="Run your first GEO audit to measure where AI cites you. Then add money prompts to track ongoing coverage."
      primaryHref="/dashboard/geo-audit"
      primaryLabel="Run first GEO audit →"
      secondaryHref="/dashboard/content?section=targeting"
      secondaryLabel="Add prompts"
      footer={
        <p className="text-xs text-muted">
          Domain:{" "}
          <span className="font-medium text-ink">{workspace.domain}</span>
          {isFleet ? (
            <>
              {" · "}
              <Link
                href="/dashboard/settings#fleet-import"
                className="font-medium text-accent hover:text-accent-deep"
              >
                Import prompts from CSV
              </Link>
            </>
          ) : null}
        </p>
      }
    />
  );
}
