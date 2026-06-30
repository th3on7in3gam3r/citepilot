"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DashboardNavLink } from "@/components/dashboard/DashboardNavLink";
import { authClient } from "@/lib/auth/client";
import { dashboardNav, dashboardNavGroups } from "@/lib/dashboard";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";

function PlanBadge({ plan }: { plan: "free" | "pilot" | "fleet" | string }) {
  const styles =
    plan === "fleet"
      ? "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/50 dark:bg-violet-950/40 dark:text-violet-300"
      : plan === "pilot"
        ? "border-accent/30 bg-accent/10 text-accent"
        : "border-border bg-surface text-muted dark:border-[#333]";

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

  const navById = Object.fromEntries(dashboardNav.map((item) => [item.id, item]));

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
      className="dash-rail flex h-[100dvh] w-[260px] shrink-0 flex-col"
      aria-label="Dashboard sidebar"
    >
      <div className="dash-rail__brand">
        <Link href="/dashboard" className="flex min-w-0 flex-1 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-white shadow-sm dark:border-[#2a2a2a] dark:bg-[#141414]">
            <Image
              src="/logo-mark.svg"
              alt=""
              width={22}
              height={22}
              className="h-[22px] w-[22px]"
              priority
            />
          </span>
          <span className="min-w-0">
            <span className="font-display block truncate text-[15px] font-bold leading-tight tracking-tight text-ink">
              CitePilot
            </span>
            <span className="block text-[11px] font-medium text-muted">
              Dashboard
            </span>
          </span>
        </Link>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-2" aria-label="Dashboard">
        {dashboardNavGroups.map((group) => {
          const items = group.itemIds
            .map((id) => navById[id])
            .filter((item): item is NonNullable<typeof item> => Boolean(item));

          if (items.length === 0) return null;

          return (
            <div key={group.label} className="dash-nav-group">
              <p className="dash-nav-group__label">{group.label}</p>
              <ul className="mt-1.5 space-y-0.5">
                {items.map((item) => (
                  <li key={item.id}>
                    <DashboardNavLink item={item} variant="rail" />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="dash-rail__footer shrink-0 p-3">
        {ready && workspace ? (
          <Link
            href="/dashboard/settings"
            className="dash-rail__workspace group"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-sm font-bold text-accent transition group-hover:bg-accent/15">
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
          <Link
            href="/dashboard/settings"
            className="dash-rail__workspace group"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface text-sm font-bold text-muted">
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
