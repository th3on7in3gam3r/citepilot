"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PilotCheckoutButton } from "@/components/billing/PilotCheckoutButton";
import { useBilling } from "@/contexts/BillingContext";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { PROMPT_LIMIT_FREE } from "@/lib/billing/limits";
import { promptsFromPreferences } from "@/lib/audit/resolve-prompts";
import { defaultWorkspacePreferences } from "@/lib/settings";
import { trackEvent } from "@/lib/analytics/track";
import { userTierForAnalytics } from "@/contexts/UpgradeModalContext";

const DISMISS_KEY = "citepilot_usage_limit_banner_dismissed";

function dismissKey(level: "warning" | "limit", count: number): string {
  return `${DISMISS_KEY}:${level}:${count}`;
}

export function DashboardUsageLimitBanner() {
  const { workspace } = useWorkspaceContext();
  const { isPaid, isFleet } = useBilling();
  const [dismissed, setDismissed] = useState(false);

  const promptCount = useMemo(() => {
    if (!workspace) return 0;
    return promptsFromPreferences(
      workspace.preferences ?? defaultWorkspacePreferences,
      workspace.buyerQuestion,
    ).length;
  }, [workspace]);

  const limit = PROMPT_LIMIT_FREE;
  const atWarning = !isPaid && promptCount >= 8 && promptCount < limit;
  const atLimit = !isPaid && promptCount >= limit;
  const level = atLimit ? "limit" : atWarning ? "warning" : null;

  useEffect(() => {
    if (!level) {
      setDismissed(false);
      return;
    }
    try {
      setDismissed(localStorage.getItem(dismissKey(level, promptCount)) === "1");
    } catch {
      setDismissed(false);
    }
  }, [level, promptCount]);

  useEffect(() => {
    if (!level || dismissed) return;
    trackEvent("usage_limit_warning_shown", {
      prompts_used: promptCount,
      limit,
      level,
      user_tier: userTierForAnalytics(isPaid, isFleet),
    });
  }, [level, dismissed, promptCount, limit, isPaid, isFleet]);

  if (!level || dismissed || isPaid) return null;

  const remaining = Math.max(0, limit - promptCount);

  function dismissBanner() {
    if (!level) return;
    try {
      localStorage.setItem(dismissKey(level, promptCount), "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }

  const isRed = level === "limit";

  return (
    <div
      className={`mb-4 flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
        isRed
          ? "border-red-300 bg-red-50 dark:border-red-900/50 dark:bg-red-950/40"
          : "border-amber-300 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/40"
      }`}
      role="status"
    >
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-semibold ${
            isRed ? "text-red-900 dark:text-red-100" : "text-amber-900 dark:text-amber-100"
          }`}
        >
          {isRed
            ? "Prompt limit reached. Upgrade to continue monitoring."
            : `${remaining} prompt${remaining === 1 ? "" : "s"} left on Free. Upgrade to Pilot for 25 prompts.`}
        </p>
        <p className="mt-0.5 text-xs text-muted">
          {promptCount}/{limit} prompts in this workspace
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <PilotCheckoutButton
          plan="pilot"
          signedIn
          variant="accent"
          feature="prompt_limit"
          source="banner"
          className="!w-auto"
        >
          <span className="px-2 text-xs">Upgrade to Pilot</span>
        </PilotCheckoutButton>
        <Link
          href="/pricing"
          className="rounded-full border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-surface"
          onClick={() =>
            trackEvent("upgrade_cta_clicked", {
              source: "banner",
              feature_name: "prompt_limit",
              plan: "pilot",
              destination: "pricing",
            })
          }
        >
          Compare plans
        </Link>
        <button
          type="button"
          onClick={dismissBanner}
          className="rounded-lg px-2 py-1 text-xs font-medium text-muted hover:text-foreground"
          aria-label="Dismiss"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
