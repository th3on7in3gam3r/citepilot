"use client";

import Link from "next/link";
import type { ReactNode } from "react";

const nav = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/audits", label: "Audits" },
  { href: "/admin/subscriptions", label: "Subscriptions" },
  { href: "/admin/health", label: "System health" },
];

export function AdminShell({
  children,
  activePath,
  adminEmail,
}: {
  children: ReactNode;
  activePath: string;
  adminEmail?: string;
}) {
  return (
    <div className="min-h-[100dvh] bg-cream">
      <header className="border-b border-border bg-white px-6 py-5 md:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">
              CitePilot · Internal
            </p>
            <h1 className="font-display text-2xl font-bold text-ink">Admin</h1>
            {adminEmail && (
              <p className="mt-1 text-sm text-muted">Signed in as {adminEmail}</p>
            )}
          </div>
          <Link href="/dashboard" className="text-sm font-medium text-muted hover:text-ink">
            User dashboard →
          </Link>
        </div>
        <nav className="mx-auto mt-5 flex max-w-7xl flex-wrap gap-2">
          {nav.map((item) => {
            const active =
              item.exact ? activePath === item.href : activePath.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  active
                    ? "bg-ink text-white"
                    : "border border-border bg-white text-ink hover:bg-surface"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-10 md:px-10">{children}</main>
    </div>
  );
}

export { formatUsd } from "@/lib/format-usd";
