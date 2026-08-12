"use client";

import { useState } from "react";
import posthog from "posthog-js";
import { redirectHomeAfterSignOut } from "@/lib/i18n/locale-cookie";

export function SignOutButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    try {
      // Prefer the dedicated route (clears cookies even if Neon Auth is down).
      // Do not hang forever on a broken NEON_AUTH_BASE_URL.
      await fetch("/api/auth/sign-out", {
        method: "POST",
        credentials: "include",
        signal: AbortSignal.timeout(8000),
      });
    } catch (error) {
      console.error("Sign out failed", error);
    }
    try {
      if (posthog.__loaded) posthog.reset();
    } catch {
      /* ignore */
    }
    redirectHomeAfterSignOut();
  }

  return (
    <button
      type="button"
      onClick={() => void handleSignOut()}
      disabled={loading}
      className={
        className ??
        "text-sm font-medium text-muted hover:text-ink disabled:opacity-60"
      }
    >
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
