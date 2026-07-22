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
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-6 text-center">
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
          className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="rounded-full border border-border bg-white px-6 py-3 text-sm font-semibold text-ink"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
