"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
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
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-cream px-6 text-center">
        <h1 className="font-display text-2xl font-bold text-ink">
          Something went wrong
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted">
          We logged the error. Try again, or return to the dashboard.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
