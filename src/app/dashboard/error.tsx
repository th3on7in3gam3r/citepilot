"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, { extra: { area: "dashboard-route" } });
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 py-16 text-center">
      <div className="w-full max-w-md rounded-2xl border border-border bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">
          Dashboard
        </p>
        <h1 className="font-display mt-3 text-2xl font-bold text-ink">
          Something went wrong
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          We logged the error. Try again, or return to setup if your workspace
          failed to load.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-deep"
          >
            Try again
          </button>
          <Link
            href="/start"
            className="inline-flex rounded-full border border-border bg-white px-6 py-2.5 text-sm font-semibold text-ink transition hover:border-accent/40"
          >
            Start setup
          </Link>
        </div>
      </div>
    </div>
  );
}
