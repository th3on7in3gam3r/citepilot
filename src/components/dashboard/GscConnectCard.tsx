"use client";

import Link from "next/link";
import { useState } from "react";
import { DashboardCard } from "@/components/dashboard/layout/DashboardCard";

export function GscConnectCard({
  workspaceId,
  compact = false,
}: {
  workspaceId?: string;
  compact?: boolean;
}) {
  const [connecting, setConnecting] = useState(false);

  async function connect() {
    if (!workspaceId) return;
    setConnecting(true);
    try {
      const res = await fetch(
        `/api/gsc/connect?workspaceId=${encodeURIComponent(workspaceId)}`,
        { credentials: "include" },
      );
      const data = (await res.json()) as { url?: string };
      if (data.url) window.location.href = data.url;
    } finally {
      setConnecting(false);
    }
  }

  return (
    <DashboardCard title="Google Search Console" dataStatus="demo">
      <div className={compact ? "space-y-3" : "space-y-4"}>
        <p className="text-sm text-[#64748b]">
          Connect Search Console to unlock live clicks, impressions, and traffic widgets.
          Until then, organic traffic cards stay hidden so you only see measured data.
        </p>
        <div className="flex flex-wrap gap-2">
          {workspaceId && (
            <button
              type="button"
              onClick={() => void connect()}
              disabled={connecting}
              className="rounded-full bg-[#0ea5e9] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0284c7] disabled:opacity-60"
            >
              {connecting ? "Redirecting…" : "Connect Search Console"}
            </button>
          )}
          <Link
            href="/dashboard/analytics"
            className="rounded-full border border-[#e2e8f0] px-5 py-2.5 text-sm font-semibold text-[#334155] transition hover:border-[#0ea5e9]/40 hover:bg-[#f8fafb]"
          >
            Open analytics
          </Link>
        </div>
      </div>
    </DashboardCard>
  );
}
