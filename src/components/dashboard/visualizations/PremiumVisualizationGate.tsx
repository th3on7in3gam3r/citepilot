"use client";

import Link from "next/link";
import { useBilling } from "@/contexts/BillingContext";

export function PremiumVisualizationGate({
  children,
  feature = "citation_intelligence",
}: {
  children: React.ReactNode;
  feature?: string;
}) {
  const { isPaid, ready } = useBilling();

  if (!ready || isPaid) {
    return <>{children}</>;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div
        className="pointer-events-none select-none blur-[6px] saturate-50"
        aria-hidden
      >
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/75 px-6 py-10 text-center backdrop-blur-[2px] dark:bg-[#0a0a0a]/80">
        <p className="font-display text-lg font-bold text-ink dark:text-white">
          Citation intelligence
        </p>
        <p className="max-w-sm text-sm text-muted dark:text-white/60">
          Prompt × platform heatmaps and competitor share-of-voice are included on
          Pilot and Fleet.
        </p>
        <Link
          href="/pricing"
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-deep"
          data-feature-gate={feature}
        >
          Upgrade to Pilot to unlock →
        </Link>
      </div>
    </div>
  );
}
