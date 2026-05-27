"use client";

import Link from "next/link";
import { PilotCheckoutButton } from "@/components/billing/PilotCheckoutButton";
import type { BillingPlan } from "@/lib/billing/types";

type UpgradePromptProps = {
  title: string;
  description: string;
  /** Default Pilot; use Fleet for API / white-label gates */
  plan?: Extract<BillingPlan, "pilot" | "fleet">;
  signedIn?: boolean;
  compact?: boolean;
};

export function UpgradePrompt({
  title,
  description,
  plan = "pilot",
  signedIn = true,
  compact = false,
}: UpgradePromptProps) {
  const checkoutLabel =
    plan === "fleet" ? "Upgrade to Fleet — $249/mo" : "Upgrade to Pilot — $79/mo";

  return (
    <div
      className={`rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/90 via-white to-white ${
        compact ? "px-4 py-3" : "px-5 py-4"
      }`}
    >
      <p className={`font-semibold text-ink ${compact ? "text-sm" : ""}`}>{title}</p>
      <p className={`mt-1 text-muted ${compact ? "text-xs" : "text-sm"}`}>
        {description}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <PilotCheckoutButton
          plan={plan}
          signedIn={signedIn}
          variant="accent"
          className="w-auto"
        >
          <span className="px-1">{checkoutLabel}</span>
        </PilotCheckoutButton>
        <Link
          href="/pricing"
          className="rounded-full border border-border bg-white px-4 py-2 text-xs font-semibold text-ink hover:bg-surface"
        >
          Compare plans
        </Link>
      </div>
    </div>
  );
}
