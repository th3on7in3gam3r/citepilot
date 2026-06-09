"use client";

import Link from "next/link";
import { useState } from "react";
import { useCopilot } from "@/components/dashboard/copilot/CopilotProvider";
import { WorkspaceSwitcher } from "@/components/dashboard/WorkspaceSwitcher";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";

export function DashboardTopBar({
  title = "Overview",
  backHref = null,
  backLabel = null,
}: {
  title?: string;
  backHref?: string | null;
  backLabel?: string | null;
}) {
  const { ready } = useWorkspaceContext();
  const { openCopilot } = useCopilot();
  const [showAddSiteForm, setShowAddSiteForm] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex h-[60px] shrink-0 items-center gap-4 border-b border-[#e8edf3] bg-white px-6 lg:px-8">
      <div className="min-w-0 shrink-0">
        {backHref && backLabel && (
          <Link
            href={backHref}
            className="mb-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-[#94a3b8] transition hover:text-[#0f172a]"
          >
            <span aria-hidden>←</span>
            {backLabel}
          </Link>
        )}
        <h1 className="font-display truncate text-lg font-bold tracking-tight text-[#0f172a]">
          {title}
        </h1>
      </div>

      <div className="mx-2 hidden h-8 w-px shrink-0 bg-[#e8edf3] md:block" aria-hidden />

      {ready ? (
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3">
          <div className="hidden min-w-0 max-w-[220px] flex-1 md:block lg:max-w-[260px]">
            <WorkspaceSwitcher
              variant="bar"
              showAddForm={showAddSiteForm}
              onAddFormConsumed={() => setShowAddSiteForm(false)}
            />
          </div>

          <div className="flex shrink-0 items-center gap-1.5 rounded-xl border border-[#e8edf3] bg-[#f8fafb] p-1">
            <Link
              href="/dashboard/geo-audit"
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#475569] transition hover:bg-white hover:text-[#0f172a]"
            >
              Run audit
            </Link>
            <span className="h-4 w-px bg-[#e2e8f0]" aria-hidden />
            <button
              type="button"
              onClick={() => setShowAddSiteForm(true)}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#475569] transition hover:bg-white hover:text-[#0f172a]"
            >
              Add site
            </button>
          </div>

          <div className="hidden h-8 w-px shrink-0 bg-[#e8edf3] sm:block" aria-hidden />

          <button
            type="button"
            onClick={openCopilot}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#0ea5e9] px-3.5 py-2 text-xs font-semibold text-white shadow-[0_1px_2px_rgba(14,165,233,0.25)] transition hover:bg-[#0284c7]"
          >
            <span aria-hidden>✦</span>
            <span className="hidden sm:inline">Copilot</span>
          </button>

          <button
            type="button"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#64748b] transition hover:bg-[#f8fafb] hover:text-[#0f172a]"
            aria-label="Notifications"
          >
            <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="ml-auto h-9 w-40 animate-pulse rounded-lg bg-[#f1f5f9]" />
      )}
    </header>
  );
}
