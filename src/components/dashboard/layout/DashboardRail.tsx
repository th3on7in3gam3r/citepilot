"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DashboardBrand } from "@/components/dashboard/layout/DashboardBrand";
import { DashboardSidebarNav } from "@/components/dashboard/layout/DashboardSidebarNav";
import { authClient } from "@/lib/auth/client";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";

function PlanBadge({ plan }: { plan: "free" | "pilot" | "fleet" | string }) {
  const styles =
    plan === "fleet"
      ? "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/50 dark:bg-violet-950/40 dark:text-violet-300"
      : plan === "pilot"
        ? "border-accent/30 bg-accent/10 text-accent"
        : "border-border bg-surface text-muted";

  const label = plan === "fleet" ? "Fleet" : plan === "pilot" ? "Pilot" : "Free";

  return (
    <span
      className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${styles}`}
    >
      {label}
    </span>
  );
}

export function DashboardRail() {
  const { workspace, limits, ready } = useWorkspaceContext();
  const [initial, setInitial] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    authClient.getSession().then(({ data }) => {
      if (!data?.user) return;
      const name = data.user.name || "";
      const userEmail = data.user.email || "";
      setEmail(userEmail);
      const letter = name.trim() ? name[0] : userEmail.trim() ? userEmail[0] : "";
      if (letter) setInitial(letter.toUpperCase());
    });
  }, []);

  const plan = limits?.plan ?? "free";

  return (
    <aside
      className="dash-rail flex h-[100dvh] w-[280px] shrink-0 flex-col"
      aria-label="Dashboard sidebar"
    >
      <div className="dash-rail__brand">
        <DashboardBrand />
      </div>

      <DashboardSidebarNav className="min-h-0 flex-1 overflow-y-auto px-3 py-3" />

      <div className="dash-rail__footer shrink-0 p-3">
        {ready && workspace ? (
          <Link href="/dashboard/settings" className="dash-rail__workspace group">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-sm font-bold text-accent transition group-hover:bg-accent/15">
              {initial ?? "?"}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="block truncate text-sm font-semibold text-ink">
                  {workspace.domain}
                </span>
                <PlanBadge plan={plan} />
              </span>
              <span className="mt-0.5 block truncate text-xs text-muted">
                {email ?? "Workspace settings"}
              </span>
            </span>
            <svg
              className="h-4 w-4 shrink-0 text-muted opacity-0 transition group-hover:opacity-100"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
            </svg>
          </Link>
        ) : (
          <Link href="/dashboard/settings" className="dash-rail__workspace group">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-sm font-bold text-muted">
              {initial ?? "?"}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-muted group-hover:text-ink">
              Account settings
            </span>
          </Link>
        )}
      </div>
    </aside>
  );
}
