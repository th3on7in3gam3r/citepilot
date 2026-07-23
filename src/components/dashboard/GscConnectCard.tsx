"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DashboardCard } from "@/components/dashboard/layout/DashboardCard";
import { useToast } from "@/components/notifications/ToastProvider";
import { effectInit } from "@/lib/react/effect-init";

export function GscConnectCard({
  workspaceId,
  compact = false,
}: {
  workspaceId?: string;
  compact?: boolean;
}) {
  const toast = useToast();
  const [connecting, setConnecting] = useState(false);
  const [serverConfigured, setServerConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    effectInit(() => {
      void fetch("/api/gsc/status", { credentials: "include" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { configured?: boolean } | null) => {
          setServerConfigured(Boolean(data?.configured));
        })
        .catch(() => setServerConfigured(false));
    });
  }, []);

  async function connect() {
    if (!workspaceId) return;
    if (serverConfigured === false) {
      toast.error(
        "Google Search Console is not configured on the server. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, then redeploy.",
      );
      return;
    }
    setConnecting(true);
    try {
      const res = await fetch(
        `/api/gsc/connect?workspaceId=${encodeURIComponent(workspaceId)}`,
        { credentials: "include" },
      );
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        toast.error(
          data.error ??
            "Could not start Search Console connection. Check Google OAuth env vars on the host.",
        );
        return;
      }
      window.location.href = data.url;
    } catch {
      toast.error("Could not start Search Console connection.");
    } finally {
      setConnecting(false);
    }
  }

  const disabled =
    connecting || !workspaceId || serverConfigured === false;

  return (
    <DashboardCard title="Google Search Console">
      <div className={compact ? "space-y-3" : "space-y-4"}>
        <p className="text-sm text-[#64748b]">
          Connect Search Console to unlock live clicks, impressions, and traffic widgets.
          Until then, organic traffic cards stay hidden so you only see measured data.
        </p>
        {serverConfigured === false && (
          <p className="text-xs text-amber-800">
            Server missing <code className="text-[11px]">GOOGLE_CLIENT_ID</code> /{" "}
            <code className="text-[11px]">GOOGLE_CLIENT_SECRET</code> — add them on
            Vercel or Render, then redeploy.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {workspaceId && (
            <button
              type="button"
              onClick={() => void connect()}
              disabled={disabled}
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
