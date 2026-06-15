"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useBilling } from "@/contexts/BillingContext";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";

const DISMISS_KEY = "citepilot_geo_badge_prompt_dismissed";

export function GeoScoreBadgePrompt() {
  const { workspace } = useWorkspaceContext();
  const { isPaid } = useBilling();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (
    dismissed ||
    isPaid ||
    !workspace?.hasRealAudit ||
    !workspace.domain
  ) {
    return null;
  }

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }

  return (
    <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-accent/25 bg-accent/5 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-display text-sm font-bold text-ink">
          Show off your GEO Score — embed your badge
        </p>
        <p className="mt-1 text-xs text-muted">
          Add a live score widget to {workspace.domain}. When visitors click through, they discover
          CitePilot — and you look like a GEO leader.
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Link
          href="/badge"
          className="inline-flex rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white transition hover:bg-accent-deep"
        >
          Get embed code
        </Link>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-full px-3 py-2 text-xs font-semibold text-muted transition hover:text-ink"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
