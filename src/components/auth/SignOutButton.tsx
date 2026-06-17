"use client";

import { useState } from "react";
import posthog from "posthog-js";
import { authClient } from "@/lib/auth/client";

export function SignOutButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    try {
      await authClient.signOut();
    } catch (error) {
      console.error("Sign out failed", error);
    }
    try {
      if (posthog.__loaded) posthog.reset();
    } catch {
      /* ignore */
    }
    window.location.assign("/");
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
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
