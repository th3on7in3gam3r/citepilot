"use client";

import {
  isApiScanPlatform,
  isBrowserScanPlatform,
} from "@/lib/scanners/platform-config";

type PlatformScanBadgeProps = {
  platformName: string;
  plan?: "free" | "pilot" | "fleet";
  compact?: boolean;
};

export function PlatformScanBadge({
  platformName,
  plan = "free",
  compact = false,
}: PlatformScanBadgeProps) {
  const isBrowser = isBrowserScanPlatform(platformName);
  const isApi = isApiScanPlatform(platformName);

  if (!isBrowser && !isApi) return null;

  if (isBrowser) {
    const locked = plan === "free";
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] font-semibold text-muted"
        title={
          locked
            ? "Browser-based scanning requires Pilot or Fleet"
            : "This platform is scanned via browser automation (takes ~30s vs ~5s for API-based platforms)"
        }
      >
        {locked ? (
          <>
            <span aria-hidden>🔒</span>
            {!compact && <span>Pilot required</span>}
          </>
        ) : (
          <>
            <span aria-hidden>🌐</span>
            {!compact && <span>Browser scan</span>}
          </>
        )}
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border border-emerald-200/60 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300"
      title="Scanned via live API (~2–5s per platform)"
    >
      <span aria-hidden>⚡</span>
      {!compact && <span>API</span>}
    </span>
  );
}
