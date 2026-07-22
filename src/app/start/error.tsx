"use client";

import Link from "next/link";
import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function StartError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-cream px-6 text-center dark:bg-background">
      <h1 className="font-display text-2xl font-bold text-ink">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted">
        Setup hit a snag. Try again, or open the dashboard — you may already be
        signed in.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(14,165,233,0.35)] hover:bg-accent-deep"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-ink hover:bg-surface"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
