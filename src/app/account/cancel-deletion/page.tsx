"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Link from "next/link";
import { authFormCardClass } from "@/components/auth/auth-styles";

function CancelDeletionContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">(
    token ? "idle" : "error",
  );
  const [message, setMessage] = useState(
    token ? "" : "Missing cancellation token.",
  );

  async function cancelDeletion() {
    setStatus("loading");
    const res = await fetch("/api/account/cancel-deletion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      setStatus("error");
      setMessage(json.error ?? "Could not cancel deletion");
      return;
    }
    setStatus("ok");
    setMessage("Your account deletion has been cancelled.");
  }

  return (
    <div className={authFormCardClass}>
      <h1 className="font-display text-2xl font-bold text-ink">
        Cancel account deletion
      </h1>
      {status === "ok" ? (
        <>
          <p className="mt-3 text-sm text-muted">{message}</p>
          <Link
            href="/auth/sign-in"
            className="mt-6 inline-block rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white"
          >
            Sign in again
          </Link>
        </>
      ) : status === "error" ? (
        <>
          <p className="mt-3 text-sm text-red-600" role="alert">
            {message}
          </p>
          <Link href="/" className="mt-6 inline-block text-sm font-semibold text-accent">
            Return home
          </Link>
        </>
      ) : (
        <>
          <p className="mt-3 text-sm text-muted">
            Click below to cancel your scheduled account deletion and restore access.
          </p>
          <button
            type="button"
            disabled={status === "loading"}
            onClick={() => void cancelDeletion()}
            className="mt-6 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {status === "loading" ? "Cancelling…" : "Cancel deletion"}
          </button>
        </>
      )}
    </div>
  );
}

export default function CancelDeletionPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-12">
      <main id="main-content" className="w-full max-w-md">
        <Suspense fallback={<p className="text-center text-sm text-muted">Loading…</p>}>
          <CancelDeletionContent />
        </Suspense>
      </main>
    </div>
  );
}
