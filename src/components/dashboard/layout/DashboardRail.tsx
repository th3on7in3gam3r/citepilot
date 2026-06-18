"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardNavLink } from "@/components/dashboard/DashboardNavLink";
import { authClient } from "@/lib/auth/client";
import { dashboardNav, dashboardNavGroups } from "@/lib/dashboard";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";

export function DashboardRail() {
  const pathname = usePathname();
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

  const planLabel =
    limits?.plan === "fleet" ? "Fleet" : limits?.plan === "pilot" ? "Pilot" : "Free";

  return (
    <aside
      className="flex h-[100dvh] w-[240px] shrink-0 flex-col border-r border-[var(--dashboard-sidebar-border)] bg-[var(--dashboard-sidebar)]"
      aria-label="Dashboard sidebar"
    >
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-[var(--dashboard-sidebar-border)] px-5">
        <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5">
          <Image
            src="/logo-mark.svg"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 shrink-0"
            priority
          />
          <span className="font-display truncate text-base font-bold tracking-tight text-ink">
            CitePilot
          </span>
        </Link>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4" aria-label="Dashboard">
        {dashboardNavGroups.map((group) => {
          const items = group.itemIds
            .map((id) => navById[id])
            .filter((item): item is NonNullable<typeof item> => Boolean(item));

          if (items.length === 0) return null;

          return (
            <div key={group.label} className="mb-5 last:mb-0">
              <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
                {group.label}
              </p>
              <ul className="space-y-0.5">
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

      <div className="shrink-0 border-t border-[var(--dashboard-sidebar-border)] p-3">
        {ready && workspace ? (
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 rounded-lg border border-border bg-surface/80 px-3 py-2.5 transition hover:border-accent/30 hover:bg-surface"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
              {initial ?? "?"}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-ink">
                {workspace.domain}
              </span>
              <span className="block truncate text-xs text-muted">
                {planLabel}
                {email ? ` · ${email.split("@")[0]}` : ""}
              </span>
            </span>
          </Link>
        ) : (
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-surface hover:text-ink"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-sm font-bold">
              {initial ?? "?"}
            </span>
            Account settings
          </Link>
        )}
      </div>
    </aside>
  );
}
