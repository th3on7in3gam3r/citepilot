"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
    <div className="rounded-2xl border border-accent/25 bg-gradient-to-br from-accent/[0.06] via-white to-white p-8 text-center shadow-sm md:p-12">
      <div
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/20 to-glow/10 text-3xl"
        aria-hidden
      >
        ◎
      </div>
      <h2 className="font-display mt-6 text-2xl font-bold text-ink md:text-3xl">
        Your citation workspace is ready
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted md:text-base">
        Add your first money prompts to start tracking where AI cites you.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href="/dashboard/content?section=targeting"
          data-tour="prompts"
          className="inline-flex rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-deep"
        >
          Add your first prompt →
        </Link>
        {isFleet && (
          <Link
            href="/dashboard/settings#fleet-import"
            className="text-sm font-semibold text-accent hover:text-accent-deep"
          >
            Import prompts from CSV
          </Link>
        )}
      </div>
      <p className="mt-6 text-xs text-muted">
        Domain: <span className="font-medium text-ink">{workspace.domain}</span>
      </p>
    </div>
  );
}
