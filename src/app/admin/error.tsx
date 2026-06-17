"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";

export default function AdminError({
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
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-cream px-6">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-white p-8 text-center shadow-sm">
        <h1 className="font-display text-2xl font-bold text-ink">Admin failed to load</h1>
        <p className="mt-3 text-sm text-muted">
          {error.message || "An unexpected error occurred while rendering the admin console."}
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-xs text-muted">Reference: {error.digest}</p>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-ink"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
